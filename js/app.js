//have code use HTML5 spec not webkit specific
window.AudioContext = window.AudioContext || window.webkitAudioContext;

function MicIO () {
  this.isPlaying = false;
  this.audioContext = new AudioContext();
  this.sourceNode = null;
  this.testSounds = null;
  this.analyser = null;
  this.fftSize = 2048;
  this.smoothingTimeConstant = 0.75;
  this.testResults = [];
}
MicIO.prototype.runTests = function() {
  var that = this;
  this.loadTestFreqs(function () {
    that._runTests();
  });
};
MicIO.prototype._runTests = function() {
  this.testTime = {
    start : new Date(),
    end : null
  };
  var i =0, l = this.testSounds.length;
  this.startPlayback(this.testSounds[0]);
  var that = this;
  var interval = setInterval(function() {
    that.testResults[i] = that.getFrequency();
    that.stopPlayback();
    if(++i === l) {
      clearInterval(interval);
      that.testTime.end = new Date();
      alert("DONE");
    } else {
      that.startPlayback(that.testSounds[i]);
    }
  }, 45);
};
MicIO.prototype.loadTestFreqs = function(callback) {
  this.testSounds = [];
  var testByteFreqs = [
    "seed.0.25.wav",  //0x0 
    "seed.0.50.wav",  //0x1 
    "seed.0.75.wav",  //0x2 
    "seed.1.00.wav",  //0x3 
    "seed.1.25.wav",  //0x4 
    "seed.1.50.wav",  //0x5 
    "seed.1.75.wav",  //0x6 
    "seed.2.00.wav",  //0x7 
    "seed.2.25.wav",  //0x8 
    "seed.2.50.wav",  //0x9 
    "seed.2.75.wav",  //0xA 
    "seed.3.00.wav",  //0xB 
    "seed.3.25.wav",  //0xC 
    "seed.3.50.wav",  //0xD 
    "seed.3.75.wav",  //0xF 
    "seed.4.00.wav",  //0x10
    "seed.4.25.wav",  //0x11
    "seed.4.50.wav",  //0x12
    "seed.4.75.wav"   //0x13
  ];
  var counter = 0;
  var that = this;
  $.each(testByteFreqs, function(index, value) {
    ++counter;
    var request = new XMLHttpRequest();
    request.open("GET", "sounds/" + value, true);
    request.responseType = "arraybuffer";

    request.onload = function() {
      that.audioContext.decodeAudioData(request.response, function(buffer) {
         that.testSounds[index] = buffer;
         if(--counter === 0) { callback(); }
      });
    };
    request.send();
  });
};
MicIO.prototype.parse = function(audioBuffer) {
  this.stopPlayback();
  this.startPlayback(audioBuffer);
  return this.getFrequency();
};
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

MicIO.prototype.getFrequency = function() {
  this.fftData = new Uint8Array(this.analyser.frequencyBinCount);
  this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;
  this.analyser.getByteFrequencyData(this.fftData);
  var highI = 0; high = 0;
  for(var i =0; i < this.analyser.frequencyBinCount; ++i) {
    if(this.fftData[i] > high) {
      highI = i;
      high = this.fftData[i];
    }
  }
  return { i: highI, val: high };
};

