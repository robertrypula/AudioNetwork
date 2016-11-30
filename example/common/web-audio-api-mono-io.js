// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var WebAudioAPIMonoIO;

WebAudioAPIMonoIO = function (fftSize, bufferSize, smoothingTimeConstant) {
    this.$$audioContext = null;
    this.$$microphone = null;
    this.$$microphoneVirtual = null;
    this.$$inGain = null;
    this.$$inAnalyzer = null;
    this.$$inProcessor = null;
    this.$$inProcessorDummyGain = null;
    this.$$outMerger = null;
    this.$$outOscillator = null;
    this.$$outOscillatorGain = null;
    this.$$preriodicWave = null;
    this.$$outProcessor = null;

    this.$$bufferSize = WebAudioAPIMonoIO.$$getValueOrDefault(bufferSize, WebAudioAPIMonoIO.$$_BUFFER_SIZE);
    this.$$sampleInHandler = null;
    this.$$sampleOutHandler = null;

    this.$$initializeCommon();
    this.$$initializeInput();
    this.$$initializeOutput();

    this.setFFTSize(fftSize);
    this.setSmoothingTimeConstant(smoothingTimeConstant);

    this.$$microphoneVirtual.connect(this.$$inGain);
    this.$$outMerger.connect(this.$$audioContext.destination);
};

WebAudioAPIMonoIO.$$firstInstance = true;
WebAudioAPIMonoIO.$$_MONO = 1;
WebAudioAPIMonoIO.$$_MUTE = 0;
WebAudioAPIMonoIO.$$_OUTPUT_WAVE_FREQUENCY = 0;
WebAudioAPIMonoIO.$$_OUTPUT_WAVE_VOLUME = 1;
WebAudioAPIMonoIO.$$_OUTPUT_WAVE_PHASE = 0;
WebAudioAPIMonoIO.$$_OUTPUT_WAVE_HARMONIC_AMPLITUDE = null;
WebAudioAPIMonoIO.$$_FFT_SIZE_MIN = 32;
WebAudioAPIMonoIO.$$_FFT_SIZE = 4 * 1024;
WebAudioAPIMonoIO.$$_SMOOTHING_TIME_CONSTANT_MIN = 0;
WebAudioAPIMonoIO.$$_SMOOTHING_TIME_CONSTANT = 0;
WebAudioAPIMonoIO.$$_BUFFER_SIZE = 8 * 1024;

WebAudioAPIMonoIO.prototype.$$initializeCommon = function () {
    if (WebAudioAPIMonoIO.$$firstInstance) {
        this.$$crossBrowserAudioContext();
        this.$$crossBrowserMediaDevices();
        WebAudioAPIMonoIO.$$firstInstance = false;
    }
    this.$$audioContext = this.$$createAudioContext();
};

WebAudioAPIMonoIO.prototype.$$initializeInput = function () {
    var self = this;

    this.$$microphoneVirtual = this.$$audioContext.createGain();
    this.$$connectMicrophoneTo(this.$$microphoneVirtual);

    this.$$inGain = this.$$audioContext.createGain();
    this.$$inAnalyzer = this.$$audioContext.createAnalyser();
    this.$$inProcessor = this.$$audioContext.createScriptProcessor(this.$$bufferSize, WebAudioAPIMonoIO.$$_MONO, WebAudioAPIMonoIO.$$_MONO);
    this.$$inProcessorDummyGain = this.$$audioContext.createGain();
    this.$$setImmediately(this.$$inProcessorDummyGain.gain, WebAudioAPIMonoIO.$$_MUTE);

    this.$$inGain.connect(this.$$inAnalyzer);
    this.$$inGain.connect(this.$$inProcessor);
    this.$$inProcessor.connect(this.$$inProcessorDummyGain);                // Chrome bug workaround
    this.$$inProcessorDummyGain.connect(this.$$audioContext.destination);   // Chrome bug workaround

    this.$$inProcessor.onaudioprocess = function (audioProcessingEvent) {
        if (WebAudioAPIMonoIO.$$isFunction(self.$$sampleInHandler)) {
            self.$$sampleInHandler(
                audioProcessingEvent.inputBuffer.getChannelData(0)
            );
        }
    };
};

WebAudioAPIMonoIO.prototype.$$initializeOutput = function () {
    var self = this;

    this.$$outMerger = this.$$audioContext.createChannelMerger(WebAudioAPIMonoIO.$$_MONO);
    this.$$outOscillator = this.$$audioContext.createOscillator();
    this.$$outOscillatorGain = this.$$audioContext.createGain();
    this.$$outProcessor = this.$$audioContext.createScriptProcessor(this.$$bufferSize, 0, WebAudioAPIMonoIO.$$_MONO);

    this.setOutputWave(
        WebAudioAPIMonoIO.$$_OUTPUT_WAVE_FREQUENCY,
        WebAudioAPIMonoIO.$$_OUTPUT_WAVE_VOLUME,
        WebAudioAPIMonoIO.$$_OUTPUT_WAVE_PHASE,
        WebAudioAPIMonoIO.$$_OUTPUT_WAVE_HARMONIC_AMPLITUDE
    );
    this.$$outOscillator.start();

    this.$$outProcessor.onaudioprocess = function (audioProcessingEvent) {
        if (WebAudioAPIMonoIO.$$isFunction(self.$$sampleOutHandler)) {
            self.$$sampleOutHandler(
                audioProcessingEvent.outputBuffer.getChannelData(0)
            );
        }
    };

    this.$$outOscillator.connect(this.$$outOscillatorGain);
    this.$$outOscillatorGain.connect(this.$$outMerger);
    this.$$outProcessor.connect(this.$$outMerger);
};

WebAudioAPIMonoIO.prototype.$$crossBrowserAudioContext = function () {
    window.AudioContext =
        window.AudioContext ||
        window.webkitAudioContext ||
        window.mozAudioContext;
};

WebAudioAPIMonoIO.prototype.$$crossBrowserMediaDevices = function () {
    var getUserMedia;

    if (navigator.mediaDevices === undefined) {
        navigator.mediaDevices = {};
    }
    if (navigator.mediaDevices.getUserMedia === undefined) {
        navigator.mediaDevices.getUserMedia = function (constraints) {
            getUserMedia =
                navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia;

            if (!getUserMedia) {
                return Promise.reject(
                    new Error('getUserMedia is not implemented in this browser')
                );
            }

            return new Promise(function (resolve, reject) {
                getUserMedia.call(navigator, constraints, resolve, reject);
            });
        }
    }
};

WebAudioAPIMonoIO.prototype.$$logAndRethrow = function (error, message) {
    alert(message);
    console.log(error);
    throw error;
};

WebAudioAPIMonoIO.prototype.$$createAudioContext = function () {
    var audioContext;

    try {
        audioContext = new window.AudioContext();
    } catch (error) {
        this.$$logAndRethrow(error, 'AudioContext creation failed');
    }

    return audioContext;
};

WebAudioAPIMonoIO.prototype.$$connectMicrophoneTo = function (node) {
    var
        self = this,
        constraints = {
            video: false,
            audio: {
                mandatory: {
                    googEchoCancellation: false, // disabling audio processing
                    googAutoGainControl: false,
                    googNoiseSuppression: false,
                    googHighpassFilter: false
                },
                optional: []
            }
        };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(function (stream) {
            self.$$microphone = self.$$audioContext.createMediaStreamSource(stream);
            self.$$microphone.connect(node);
        })
        .catch(function (error) {
            self.$$logAndRethrow(error, 'Microphone initialization failed');
        });
};

WebAudioAPIMonoIO.prototype.$$setImmediately = function (audioParam, value) {
    var now = this.$$audioContext.currentTime;

    audioParam.value = value;
    audioParam.setValueAtTime(value, now);
};

WebAudioAPIMonoIO.$$isFunction = function (variable) {
    return typeof variable === 'function';
};

WebAudioAPIMonoIO.$$getValueOrDefault = function (value, defaultValue) {
    return typeof value !== 'undefined' ? value : defaultValue;
};

WebAudioAPIMonoIO.prototype.setOutputWave = function (frequency, volume, phase, harmonicAmplitude) {
    var real, imag, i, x, harmonicNumber;

    frequency = WebAudioAPIMonoIO.$$getValueOrDefault(frequency, WebAudioAPIMonoIO.$$_OUTPUT_WAVE_FREQUENCY);
    volume = WebAudioAPIMonoIO.$$getValueOrDefault(volume, WebAudioAPIMonoIO.$$_OUTPUT_WAVE_VOLUME);
    phase = WebAudioAPIMonoIO.$$getValueOrDefault(phase, WebAudioAPIMonoIO.$$_OUTPUT_WAVE_PHASE);

    if (!harmonicAmplitude) {
        harmonicAmplitude = [];
        harmonicAmplitude.push(1);
    }

    real = new Float32Array(1 + harmonicAmplitude.length);
    imag = new Float32Array(1 + harmonicAmplitude.length);
    x = 2 * Math.PI * (-phase);
    real[0] = 0;
    imag[0] = 0;
    for (i = 0; i < harmonicAmplitude.length; i++) {
        harmonicNumber = 1 + i;
        real[harmonicNumber] = harmonicAmplitude[i] * Math.sin(x * harmonicNumber);
        imag[harmonicNumber] = harmonicAmplitude[i] * Math.cos(x * harmonicNumber);
    }

    this.$$preriodicWave = this.$$audioContext.createPeriodicWave(real, imag);
    this.$$setImmediately(this.$$outOscillator.frequency, frequency);
    this.$$outOscillator.setPeriodicWave(this.$$preriodicWave);
    this.$$setImmediately(this.$$outOscillatorGain.gain, volume);
};

WebAudioAPIMonoIO.prototype.setSampleInHandler = function (callback) {
    if (WebAudioAPIMonoIO.$$isFunction(callback)) {
        this.$$sampleInHandler = callback.bind(callback);
    } else {
        this.$$sampleInHandler = null;
    }
};

WebAudioAPIMonoIO.prototype.setSampleOutHandler = function (callback) {
    if (WebAudioAPIMonoIO.$$isFunction(callback)) {
        this.$$sampleOutHandler = callback.bind(callback);
    } else {
        this.$$sampleOutHandler = null;
    }
};

WebAudioAPIMonoIO.prototype.setFFTSize = function (fftSize) {
    fftSize = WebAudioAPIMonoIO.$$getValueOrDefault(fftSize, WebAudioAPIMonoIO.$$_FFT_SIZE);
    if (this.$$inAnalyzer.fftSize !== fftSize) {
        this.$$inAnalyzer.fftSize = fftSize;
    }
};

WebAudioAPIMonoIO.prototype.setSmoothingTimeConstant = function (smoothingTimeConstant) {
    smoothingTimeConstant = WebAudioAPIMonoIO.$$getValueOrDefault(smoothingTimeConstant, WebAudioAPIMonoIO.$$_SMOOTHING_TIME_CONSTANT);
    if (this.$$inAnalyzer.smoothingTimeConstant !== smoothingTimeConstant) {
        this.$$inAnalyzer.smoothingTimeConstant = smoothingTimeConstant;
    }
};

WebAudioAPIMonoIO.prototype.getFrequencyData = function () {
    var data;

    data = new Float32Array(this.$$inAnalyzer.frequencyBinCount);   // same as: 0.5 * fftSize
    this.$$inAnalyzer.getFloatFrequencyData(data);

    return data;
};

WebAudioAPIMonoIO.prototype.getTimeDomainData = function () {
    var data;

    data = new Float32Array(this.$$inAnalyzer.fftSize);
    this.$$inAnalyzer.getFloatTimeDomainData(data);

    return data;
};

WebAudioAPIMonoIO.prototype.getSampleRate = function () {
    return this.$$audioContext.sampleRate;
};
