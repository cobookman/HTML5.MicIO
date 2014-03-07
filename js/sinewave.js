/*
   Sine Wave Generator for Web Audio API.
   Currently works on Chrome.

   Mohit Cheppudira - http://0xfe.blogspot.com
*/

/* Create a generator for the given AudioContext. */
SineWave = function(context) {
  this.x = 0;
  this.context = context;
  this.sampleRate = this.context.sampleRate;
  this.frequency = 440;
  this.next_frequency = this.frequency;
  this.amplitude = 0.75;
  this.nr = true; // noise reduction

  // Create an audio node for the tone generator
  this.node = context.createJavaScriptNode(256, 3, 3);

  // Setup audio data callback for this node. The callback is called
  // when the node is connected and expects a buffer full of audio data
  // in return.
  var that = this;
  this.node.onaudioprocess = function(e) { that.process(e) };
}

SineWave.prototype.setAmplitude = function(amplitude) {
  this.amplitude = amplitude;
}

// Enable/Disable Noise Reduction
SineWave.prototype.setNR = function(nr) {
  this.nr = nr;
}

SineWave.prototype.setFrequency = function(freq) {
  this.next_frequency = freq;
}

SineWave.prototype.getAudioNode = function() {
  return this.node;
}

SineWave.prototype.process = function(e) {
  // Get a reference to the output buffer and fill it up.
  var data = e.outputBuffer.getChannelData(0);

  // We need to be careful about filling up the entire buffer and not
  // overflowing.
  for (var i = 0; i < data.length; ++i) {
    data[i] = this.amplitude * Math.sin(
        this.x++ / (this.sampleRate / (this.frequency * 2 * Math.PI)));
    // A vile low-pass-filter approximation begins here.
    //
    // This reduces high-frequency blips while switching frequencies. It works
    // by waiting for the sine wave to hit 0 (on it's way to positive territory)
    // before switching frequencies.
    if (this.next_frequency != this.frequency) {
      if (this.nr) {
        // Figure out what the next point is.
        next_data = this.amplitude * Math.sin(
          this.x / (this.sampleRate / (this.frequency * 2 * Math.PI)));

        // If the current point approximates 0, and the direction is positive,
        // switch frequencies.
        if (data[i] < 0.001 && data[i] > -0.001 && data[i] < next_data) {
          this.frequency = this.next_frequency;
          this.x = 0;
        }
      } else {
        this.frequency = this.next_frequency;
        this.x = 0;
      }
    }
  }
}
