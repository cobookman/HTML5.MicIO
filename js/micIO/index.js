function MicIO (callback) {
  //have code use HTML5 spec not webkit specific
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  this.isPlaying = false;
  this.audioContext = new AudioContext();

  //Put clock up above, as it's used in other funcitons
  this.clock = new Clock({
    frequency : 4, //in hz
    onHigh : this.onHigh,
    onLow : this.onLow
  });
  
  this.sourceNode = null;
  this.testSounds = null;
  this.analyser = null;
  this.freqIncrement = 312; //Hz - A bit of TESTING REQUIRED TO OBTAIN VALUE!!!
  this.fftSize = 1024;
  var that = this;
  var period = this.clock.period;
  var halfPeriod = this.clock.period/2;
  this.whenDone = callback;
  this.getMic(function then() {
    that.createAnalyser(that.micSource);
    that.run();
  });
}
/*
  Super ugly code...i know, but it 'works', and theres
  quite a bit of timeing 'fun' involved
*/
MicIO.prototype.run = function() {
  var time2Check = false;
  var clockCycles = 0;
  var that = this;
  var interval;
  var fullCycle = false;
  _run();
  var lastVal = null;
  var curVal = null;
  var seenLastValFor = 0;
  var data = [];
  function _run() {

    that.clock.start(); //start our clock
    setInterval(function() {
        curVal = that.uint8ToInt(that.strongestFrequency());
        //Have we seen this value before...if its been > 17 times end of data stream
        if(lastVal == curVal) {
          if(++seenLastValFor > 30) {
            that.whenDone(data);
          }
        } else if( curVal !==0) {
          seenLastValFor = 0;
          console.log(curVal);
          data.push(curVal);
        }
        lastVal = curVal;
    }, 25);
  }
};
/*
  Binds the computer's mic to audioContext
*/
MicIO.prototype.bindMic = function(stream) {
  this.micSource = this.audioContext.createMediaStreamSource(stream);
};
/*
  Bind an audio source to the webAudio API's fft
*/
MicIO.prototype.createAnalyser = function(source) {
  this.analyser = this.audioContext.createAnalyser(source);
  this.analyser.fftSize = this.fftSize;
  source.connect(this.analyser);
};
/*
  Requests permission to use a mic, then binds it to audio context
*/
MicIO.prototype.getMic = function(then) {
    try {
      navigator.getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia;
        var that = this;
        navigator.getUserMedia(
          {audio:true},
          function(stream) { that.bindMic(stream); then(); }, //onSuccess
          function() { alert("ERROR binding to mic"); }  //onFail
        );
    } catch (e) {
        alert('getUserMedia threw exception :' + e);
    }
};

/////////////////////////////////////////////////////////////////////////////////////////////


MicIO.prototype.fft = function() {
  this.fftData = new Uint8Array(this.analyser.frequencyBinCount);
  //this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;
  this.analyser.getByteFrequencyData(this.fftData);
  return this.fftData;
};
/*
  Finds the strongest frequency in the FFT Data
*/
MicIO.prototype.strongestFrequency = function() {
  var fftData = this.fft();

  var strongestFreq = 0;
  var highestFreqStrength = 0;
  //Known startingFrequency is at 7.  Start for loop @ 5 to act as a 'high pass' filter
  for(var i =5; i < this.analyser.frequencyBinCount; ++i) {
    if(fftData[i] > highestFreqStrength) {
      strongestFreq = i;
      highestFreqStrength = fftData[i];
    }
  }

  return strongestFreq;
};
/*
  Converts uint8 val from fft to its corresponding
  frequency, anything below 500 and above 5500
  is considered noise, hence it being set to 0
  (reason being that our 0x0-0xF uses freqs in [818, 4823] hz)
*/
MicIO.prototype.uint8ToFreq = function(num8) {
  var freq = num8 * this.audioContext.sampleRate/this.fftSize;
  if(freq < 500 || freq > 5500) {
    freq = 0;
  }
  return freq;
};
/*
  turns a uint8 val from fft to its corresponding integer value.  
  300Hz = 0, and for every increment of ~300Hz, the integer
  value represented is +1. E.g:  1.5Khz = 4
  ----
    Testing REQUIRED for each uChip.
    MBED outputs a sinusoid of frequency = (seedInteger + 1) * 312Hz
  -----
*/
MicIO.prototype.uint8ToInt = function(num8) {
  var output = Math.round((this.uint8ToFreq(num8) - 818)/265);
  if(output < 0) {
    output = 0;
  }
  return output;
};
