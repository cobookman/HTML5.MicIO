/* Mbed MicIO library
 * Copyright (c) 2014, Colin Bookman, cobookman [at] gmail [dot] com 
 * 
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

#ifndef MBED_MICIO_H
#define MBED_MICIO_H

#include "mbed.h"

/**
 * @code
 * #include "MicIO.h"
 * 
 * MicIO micIO(p18,p19); //AnalogOut (Output - Mic), AnalogIn (Input Headphone Left/Right)
 * 
 * int main() {
 *     micIO.send("HI WORLD", 8);
 *     micIO.send([0xFF, 0xFA, 0xFB, 0x00], 4);
 * }
 * @endcode
 */
class MicIO {
public:

    /** Create a MicIO instance */
    MicIO(PinName output, PinName input);
    float clockPeriod;
    
    /* Send byte array through micIO */
    void send(const char * arr, int length);
    
    /* Send just 4 bits */
    void send4Bits(unsigned char byte);
    
    /*
        Read the current value of the input clock.
        1 = high
        0 = low
        -1 = unchanged
    */
    int clock();
    
    /* Extracts the lower 4 bits of a byte */
    unsigned char lower4Bits(unsigned char byte);
    /* Extracts the upper 4 bits of a byte */
    unsigned char upper4Bits(unsigned char byte);
    
protected:
    AnalogOut _micOut;
    AnalogIn  _clockIn;
    float _sinTable[361]; //361 in case of overflow...not that it SHOULD happen
    /*
        sendSin outputs a sin wave for 1 period.
                -------------------------
                |Speed  |               |
                |Factor | Frequency     |
                |------------------------
                | 4.75  |   5.73Khz     |
                | 4.50  |   5.45Khz     |
                | 4.25  |   5.13Khz     |
                | 4.00  |   4.84Khz     |
                | 3.75  |   4.54Khz     |
                | 3.50  |   4.23Khz     |
                | 3.25  |   3.92Khz     |
                | 3.00  |   3.65-3.62Khz|
                | 2.75  |   3.33Khz     |
                | 2.50  |   3Khz        |
                | 2.25  |   2.73Khz     |
                | 2.00  |   2.41Khz     |
                | 1.75  |   2.12Khz     |
                | 1.50  |   1.818Khz    |
                | 1.25  |   1.5Khz      |
                | 1.00  |   1.2Khz      |
                | 0.75  |   0.909KHz    |
                | 0.5   |   0.606Khz    |
                -------------------------
    */
    void _sendSin(float sinSeed); //sinSeed of 1 = 5khz
    
    /* Get the number of cycles the sin wave should run for */
    int _numCycles(float sinSeed);
    
    /* Generate a sin Table */
    void _genSinTable();
    
     /* Go from 4 bits to a sin seed */
    float _getSinSeed(unsigned char bits4);
    
};

#endif
