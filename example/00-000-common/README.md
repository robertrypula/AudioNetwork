# Common classes used in examples

Classes described below are not dependent to Audio Network project. You can grab them
as standalone files and use in your project.

## AudioMonoIO

AudioMonoIO = function (fftSize, bufferSize, smoothingTimeConstant)
 
AudioMonoIO.prototype.setVolume = function (volume)
 
AudioMonoIO.prototype.setLoopback = function (state)
 
AudioMonoIO.prototype.setPeriodicWave = function (frequency, volume, phase, harmonicAmplitude, harmonicPhase)

AudioMonoIO.prototype.setSampleInHandler = function (callback)
 
AudioMonoIO.prototype.setSampleOutHandler = function (callback)

AudioMonoIO.prototype.setFFTSize = function (fftSize)
 
AudioMonoIO.prototype.getFFTSize = function ()
 
AudioMonoIO.prototype.setSmoothingTimeConstant = function (smoothingTimeConstant)
 
AudioMonoIO.prototype.getFrequencyData = function ()
 
AudioMonoIO.prototype.getTimeDomainData = function ()

AudioMonoIO.prototype.getSampleRate = function ()
 
AudioMonoIO.prototype.getFFTResolution = function ()

-----------------------------

## FFTResult
 
FFTResult = function (fftData, sampleRate)
 
FFTResult.prototype.getLoudestBinIndex = function (frequencyStart, frequencyEnd)
 
FFTResult.prototype.getLoudestFrequency = function (frequencyStart, frequencyEnd)
 
FFTResult.prototype.getLoudestDecibel = function (frequencyStart, frequencyEnd)
 
FFTResult.prototype.getDecibel = function (frequencyBinIndex)
 
FFTResult.prototype.getDecibelFromFrequency = function (frequency)
 
FFTResult.prototype.getFrequency = function (frequencyBinIndex)
 
FFTResult.prototype.getFrequencyOfClosestBin = function (frequency)
 
FFTResult.prototype.getBinIndex = function (frequency)
 
FFTResult.prototype.getResolution = function ()

FFTResult.prototype.getLastBinIndex = function ()
 
FFTResult.prototype.getLastFrequency = function ()
 
FFTResult.prototype.getNyquistFrequency = function ()
 
FFTResult.prototype.getFFTSize = function ()
 
FFTResult.prototype.equal = function (fftResult)
 
FFTResult.getResolution = function (sampleRate, fftSize)
 
FFTResult.getFrequency = function (frequencyBinIndex, sampleRate, fftSize)
 
FFTResult.getBinIndex = function (frequency, sampleRate, fftSize)
 
FFTResult.getFrequencyOfClosestBin = function (frequency, sampleRate, fftSize)

-----------------------------

## MusicCalculator
 
MusicCalculator = function (a4Frequency)
 
MusicCalculator.prototype.getSemitoneNumber = function (frequency)
 
MusicCalculator.prototype.getFrequency = function (semitoneNumber)
 
MusicCalculator.prototype.getNoteName = function (semitoneNumber)
 
MusicCalculator.prototype.getFirstSemitoneNumber = function (semitoneNumber)
 
MusicCalculator.getNoteName = function (semitoneNumber)
 
MusicCalculator.getFirstSemitoneNumber = function (octaveNumber)
