function Clock(params) {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  this.audioContext = new AudioContext();
  this.period = 1/params.frequency * 1000; //in ms
  this.frequency = params.frequency;
  this.oscillator = null;
  this.createOscillator();
  this.onHigh = params.onHigh || function() {};
  this.onLow = params.onLow   || function() {};
}
Clock.prototype.createOscillator = function() {
  if(!this.oscillator) {
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.type = 1; //square wave
    this.oscillator.frequency.value = this.frequency;
    this.oscillator.connect(this.audioContext.destination);
  }
};
Clock.prototype.start = function() {
  if(!this.oscillator) { this.createOscillator(); }
  var that = this;
  this.oscillator.start(0);
};

Clock.prototype.stop = function() {
  this.oscillator.stop(0);
  this.oscillator.disconnect();
  this.oscillator = null; //destroy oscilator reference 
};
