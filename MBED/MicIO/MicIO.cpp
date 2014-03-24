#include "MicIO.h"
#include "TextLCD.h"
TextLCD lcd(p24, p25, p26, p27, p28, p29);

MicIO::MicIO(PinName micOut, PinName clockIn) : _micOut(micOut), _clockIn(clockIn) {
    clockPeriod = 0.25;
    wait(0.015);        // Wait 15ms to ensure powered up
    _genSinTable();    //Generate the sin table
}

/* Send byte array through micIO */
void MicIO::send(const char * inputStr, int length) {
    unsigned char * outputStr;
    outputStr = (unsigned char*) inputStr;
    int numberOf4BitPairs = length * 2;
    int current4BitIndex = 0;
    int fourBits;
    float sinSeed; //default at something ridculously high to stop an inf loop occuring
    int clockState = clock(); //default the clock state to correct value
    
    /*
                Parse out the 4 bits we're sending this clock cycle
        */
        if(current4BitIndex %2 == 0) { //upper 4 bits
            fourBits = upper4Bits(outputStr[current4BitIndex/2]);
        } else { //lower 4 bits
            fourBits = lower4Bits(outputStr[current4BitIndex/2]);
        }
        sinSeed = _getSinSeed(fourBits); //get new sinSeed
    
    
    while(current4BitIndex < numberOf4BitPairs) {
        if(clock() == 0) { //Clock changed to low
            
            /*
                Output sinusoid pulse
            */
             _sendSin(sinSeed);
            /*
                We're at the next clock cycle, and recieved a low. 
                master done reading the sinusoid. Lets move on to the next 4bits
            */
            clockState = 0;
            ++current4BitIndex;
            /*
                Parse out the next 4 bits we're sending this clock cycle
            */
            if(current4BitIndex %2 == 0) { //upper 4 bits
                fourBits = upper4Bits(outputStr[current4BitIndex/2]);
            } else { //lower 4 bits
                fourBits = lower4Bits(outputStr[current4BitIndex/2]);
            }
            lcd.printf("%i",fourBits);
            sinSeed = _getSinSeed(fourBits); //get new sinSeed
        }
    }
}
/* Read the current value of the input clock */
int MicIO::clock() {
    static int clockState = 0; //start clock @ low
    float average = 0;
    for(int i =0; i < 10; ++i) {
        average += _clockIn.read();
    }
    average = average/10;
    //Foce there to be high->low->high->low pattery w/clockState static int
    if(average > 0.6 && clockState == 0){ //actually ~0.71
        clockState = 1;
        return 1;
    } else if (average < 0.485 && clockState == 1) { //actually ~0.43
        clockState = 0;
        return 0;
    } 
    return -1; //NO CHANGE TO CLOCK
}
/* Extracts the lower 4 bits of a byte */
unsigned char MicIO::lower4Bits(unsigned char byte) {
    return (byte & 0x0F);
}
/* Extracts the upper 4 bits of a byte */
unsigned char MicIO::upper4Bits(unsigned char byte) {
    return (byte >> 4) & 0x0F;
}
/* Send a sin Wave  - bursts of 40 cycles*/
void MicIO::_sendSin(float sinSeed) {
    int cycles = _numCycles(sinSeed);
    for(int c = 0; c < cycles; ++c) {
        for(float i = 0; i < 360; i+=sinSeed) {
            _micOut = _sinTable[(int) i];
        }
    }
    _micOut = 0.5; //Null Output
        
}
/* Generate a sin Table */
void MicIO::_genSinTable() {
    for(int i = 0; i < 361; ++i) {
        float temp = i;
        _sinTable[i] = sin(temp/180*3.141)*0.5+0.5;
    }
}
/* Go from 4 bits to a sin seed */
float MicIO::_getSinSeed(unsigned char bits4) {
    /*
        By having sinSeed @ 1024 by default, if for some reason its not assigned, graceful
        degradation occurs.
    */
    float sinSeed = 1024; //Default it to a large number for graceful degregation.
    switch(bits4 & 0xF) { //switch just the 4 bits (force to 4 bits)
        case 0x0 : sinSeed = 0.75; break;
        case 0x1 : sinSeed = 1.00; break;
        case 0x2 : sinSeed = 1.25; break;
        case 0x3 : sinSeed = 1.50; break;
        case 0x4 : sinSeed = 1.75; break;
        case 0x5 : sinSeed = 2.00; break;
        case 0x6 : sinSeed = 2.25; break;
        case 0x7 : sinSeed = 2.50; break;
        case 0x8 : sinSeed = 2.75; break;
        case 0x9 : sinSeed = 3.00; break;
        case 0xA : sinSeed = 3.25; break;
        case 0xB : sinSeed = 3.50; break;
        case 0xC : sinSeed = 3.75; break;
        case 0xD : sinSeed = 4.00; break; 
        case 0xE : sinSeed = 4.25; break;
        case 0xF : sinSeed = 4.50; break;
    }
    return sinSeed;
}
/*
   number of cycles sinusoid needs to run...kind of guesswork
*/
int MicIO::_numCycles(float sinSeed) { 
    float quarterPeriod = clockPeriod/2;
    float timePerSinusoidPeriod =  1/(sinSeed*1000);
    return static_cast<int>((quarterPeriod/timePerSinusoidPeriod)); //floor to integer
}