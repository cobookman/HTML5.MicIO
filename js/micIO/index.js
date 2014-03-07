function MicIO () {
  //have code use HTML5 spec not webkit specific
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  this.isPlaying = false;
  this.audioContext = new AudioContext();
  this.sourceNode = null;
  this.testSounds = null;
  this.analyser = null;
  this.fftSize = 1024;
  this.freqIncrement = 312; //Hz - A bit of TESTING REQUIRED TO OBTAIN VALUE!!!
  //this.smoothingTimeConstant = 0.75;
}
MicIO.prototype.stopPlayback = function() {
  var now = this.audioContext.currentTime;
  if(this.isPlaying) {
    this.sourceNode.stop(now);
    this.sourceNode = null;
    this.analyser = null;
    this.isPlaying = false;
    return true; //stopped playback
  } else {
    return false; //Nothing to stop
  }
};
MicIO.prototype.startPlayback = function(audioBuffer) {
  this.sourceNode = this.audioContext.createBufferSource();
  this.sourceNode.buffer = audioBuffer;
  this.sourceNode.loop = true;
  
  this.analyser = this.audioContext.createAnalyser();
  this.analyser.fftSize = this.fftSize;
 
  this.sourceNode.connect(this.analyser);
  this.analyser.connect(this.audioContext.destination);
  this.sourceNode.start(0);
  this.isPlaying = true;
};
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
  for(var i =0; i < this.analyser.frequencyBinCount; ++i) {
    if(fftData[i] > highestFreqStrength) {
      strongestFreq = i;
      highestFreqStrength = fftData[i];
    }
  }

  return strongestFreq;
};
MicIO.prototype.uint8ToFreq = function(num8) {
  return num8 * this.audioContext.sampleRate/this.fftSize;
};
/*
  uint8ToInt turns a uint8 val from fft to its
  corresponding integer value.  
  300Hz = 0, and for every +300Hz, the integer
  value represented is +1. E.g:  1.5Khz = 4
  ----
    Testing REQUIRED for each uChip.
    MBED should inc by 300Hz, actuality its 312Hz
  -----
*/
MicIO.prototype.uint8ToInt = function(num8) {
  var output = Math.round(this.uint8ToFreq(num8)/this.freqIncrement);
  //Move to range of 0->17...aka 1 Byte
  if(output >0) {
    --output;
  }
  return output;
};

