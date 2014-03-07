function MicIO () {
  //have code use HTML5 spec not webkit specific
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  this.isPlaying = false;
  this.audioContext = new AudioContext();
  this.sourceNode = null;
  this.testSounds = null;
  this.analyser = null;
  this.fftSize = 2048;
  this.smoothingTimeConstant = 0.75;
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
  this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;
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
/*
  freq2Int turns a frequency value between:
     [0,this.analyser.frequencyBinCount),
  to the corresponding integer value:
     [0x0, 0x12]
  each frequency is ~15 appart and the starting 
  frequency is 15. 2nd is 29. 3rd is 44...etc
*/
MicIO.prototype.freq2Int = function(frequency) {
  var integerValue = 0;
  for(var freqThreshold = 22; freqThreshold < 1024; freqThreshold+=15) {
    if(frequency < freqThreshold) {
      return integerValue;
    }
    ++integerValue;
  }
};

