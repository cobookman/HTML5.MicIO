function MicIOTests (intervalSpeed, iterations) {
  this.intervalSpeed = intervalSpeed;
  this.iterations = iterations;
  this.micIO = new MicIO();
  this.testResults = [];
  this.testByteFreqs = [
 /* filename in the |  Hex  
    sounds/ folder  | Value   */
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
    "seed.4.75.wav"   //0x13 - NOT STABLE!
  ];
  var that = this;
  this.loadTestFreqs(function then() {
    //Timeout needed for w/e reason.  SOmething be lagging
    setTimeout(function() {
      that.runTests();
    }, 150);
  });
}
/*
  Code plays each samples of each output frequency,
  and checks to make sure the sound is
  successfully parsed into data
*/
MicIOTests.prototype.runTests = function() {
  /*
    the unsigned decimal value
    associated with testSound[i], is i. 
    Also, we're dealing with lots of async
    interval calls.  we check if i==l later on to 
    see if we've finished calling every testSound.
    Think of it as an Async Interval for loop
  */
  var i =0;
  var l = this.testSounds.length;
  var that = this;

  /* 
    We play the sound first, then check the frequency.
    This is to ensure each time we check the frequency there's 
    a good amount of sound to be analyized. 
    E.g: We play the frequency for ~50ms, then analyize it.
    Then play the next frequency and wait ~50, then....
  */
  this.micIO.startPlayback(this.testSounds[0]);
  
  //Record the time it takes to run all the tests
  this.testTime = {
    start : new Date(),
    end : null
  };
  /*
    The test 'async for loop'
  */
  var interval = setInterval(function() {
    //Save strongest frequency and nothing else.  We don't have the time to do anything else
    that.testResults[i] = that.micIO.strongestFrequency();
    that.micIO.stopPlayback();
    if(++i === l) {
      clearInterval(interval); //stops the 'async for loop'
      that.testTime.end = new Date();
      that.checkTestResults();
    } else {
      that.micIO.startPlayback(that.testSounds[i]);
    }
  }, this.intervalSpeed);

};
MicIOTests.prototype.checkTestResults = function() {
  for(var i = 0, l = this.testResults.length; i < l; ++i) {
    var intVal = this.micIO.uint8ToInt(this.testResults[i]);
    if(i !== intVal) {
      alert("Test failed\nShould have seen: " + i + " but saw: " + intVal + ", had freq: " + this.testResults[i]);
    } else {
    }
  }
  if(--this.iterations !== 0) {
    this.runTests();
  }
  return true;
};
/*
  Loads a sample arraybuffer sound clip for 
  each frequency.  These are stored in testSounds.
  Index i of testSounds relates to value 'i'.
  E.g: testSounds[1] contains a sound clip for what
  micIO should parse as a 0x1.
*/
MicIOTests.prototype.loadTestFreqs = function(callback) {
  this.testSounds = [];
  
  var counter = 0;
  var that = this;

  $.each(this.testByteFreqs, function(index, filename) {
    ++counter;
    var request = new XMLHttpRequest();
    request.open("GET", "sounds/" + filename, true);
    request.responseType = "arraybuffer";

    request.onload = function() {
      that.micIO.audioContext.decodeAudioData(request.response, function(buffer) {
         that.testSounds[index] = buffer;
         if(--counter === 0) { callback(); }
      });
    };
    request.send();
  });
};
