// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var AudioMonoIO;

AudioMonoIO = function (fftSize, bufferSize, smoothingTimeConstant) {
    this.$$audioContext = null;
    this.$$microphone = null;
    this.$$microphoneVirtual = null;
    this.$$masterIn = null;
    this.$$masterOut = null;
    this.$$masterOutVolume = null;

    this.$$sampleProcessor = null;

    this.$$inAnalyzer = null;
    this.$$outOscillator = null;
    this.$$outOscillatorGain = null;

    this.$$fftSize = AudioMonoIO.$$getValueOrDefault(
        fftSize,
        AudioMonoIO.$$_FFT_SIZE
    );
    this.$$bufferSize = AudioMonoIO.$$getValueOrDefault(
        bufferSize,
        AudioMonoIO.$$_BUFFER_SIZE
    );
    this.$$smoothingTimeConstant = AudioMonoIO.$$getValueOrDefault(
        smoothingTimeConstant,
        AudioMonoIO.$$_SMOOTHING_TIME_CONSTANT
    );

    this.$$sampleInHandler = null;
    this.$$sampleOutHandler = null;

    this.$$loopbackEnabled = false;

    this.$$initialize();
};

AudioMonoIO.$$firstInstance = true;

AudioMonoIO.$$_MONO = 1;
AudioMonoIO.$$_MONO_INDEX = 0;

// default values for setPeriodicWave method
AudioMonoIO.$$_OUTPUT_WAVE_FREQUENCY = 0;
AudioMonoIO.$$_OUTPUT_WAVE_VOLUME = 1;
AudioMonoIO.$$_OUTPUT_WAVE_PHASE = 0;
AudioMonoIO.$$_OUTPUT_WAVE_HARMONIC_AMPLITUDE = [ 1 ];
AudioMonoIO.$$_OUTPUT_WAVE_HARMONIC_PHASE = [ 0 ];

// default values for AudioMonoIO class constructor
AudioMonoIO.$$_FFT_SIZE = 2 * 1024;
AudioMonoIO.$$_BUFFER_SIZE = 4 * 1024;
AudioMonoIO.$$_SMOOTHING_TIME_CONSTANT = 0;

AudioMonoIO.prototype.$$normalizeBrowserApi = function () {
    if (AudioMonoIO.$$firstInstance) {
        this.$$crossBrowserAudioContext();
        this.$$crossBrowserMediaDevices();
        AudioMonoIO.$$firstInstance = false;
    }
};

AudioMonoIO.prototype.$$initialize = function () {
    this.$$normalizeBrowserApi();
    this.$$audioContext = this.$$createAudioContext();

    this.$$initializeCommon();
    this.$$initializeInput();
    this.$$initializeOutput();

    this.$$sourceAttach();
    this.$$masterOutVolume.connect(this.$$audioContext.destination);
};

AudioMonoIO.prototype.$$sourceDetach = function () {
    if (!this.$$loopbackEnabled) {
        this.$$microphoneVirtual.disconnect(this.$$masterIn);
    } else {
        this.$$masterOut.disconnect(this.$$masterIn);
    }
};

AudioMonoIO.prototype.$$sourceAttach = function () {
    if (!this.$$loopbackEnabled) {
        this.$$microphoneVirtual.connect(this.$$masterIn);
    } else {
        this.$$masterOut.connect(this.$$masterIn);
    }
};

AudioMonoIO.prototype.$$initializeCommon = function () {
    this.$$microphoneVirtual = this.$$audioContext.createGain();
    this.$$connectMicrophoneTo(this.$$microphoneVirtual);

    this.$$masterIn = this.$$audioContext.createGain();
    this.$$masterOut = this.$$audioContext.createGain();
    this.$$masterOutVolume = this.$$audioContext.createGain();

    this.$$sampleProcessor = this.$$audioContext.createScriptProcessor(
        this.$$bufferSize,
        AudioMonoIO.$$_MONO,
        AudioMonoIO.$$_MONO
    );
    this.$$sampleProcessor.onaudioprocess = this.$$onAudioProcessHandler.bind(this);

    this.$$masterIn.connect(this.$$sampleProcessor);
    this.$$sampleProcessor.connect(this.$$masterOut);
    this.$$masterOut.connect(this.$$masterOutVolume);
};

AudioMonoIO.prototype.$$initializeInput = function () {
    this.$$inAnalyzer = this.$$audioContext.createAnalyser();

    this.setFFTSize(this.$$fftSize);
    this.setSmoothingTimeConstant(this.$$smoothingTimeConstant);

    this.$$masterIn.connect(this.$$inAnalyzer);
};

AudioMonoIO.prototype.$$initializeOutput = function () {
    this.$$outOscillator = this.$$audioContext.createOscillator();
    this.$$outOscillatorGain = this.$$audioContext.createGain();

    this.setPeriodicWave(
        AudioMonoIO.$$_OUTPUT_WAVE_FREQUENCY,
        AudioMonoIO.$$_OUTPUT_WAVE_VOLUME,
        AudioMonoIO.$$_OUTPUT_WAVE_PHASE,
        AudioMonoIO.$$_OUTPUT_WAVE_HARMONIC_AMPLITUDE,
        AudioMonoIO.$$_OUTPUT_WAVE_HARMONIC_PHASE
    );
    this.$$outOscillator.start();

    this.$$outOscillator.connect(this.$$outOscillatorGain);
    this.$$outOscillatorGain.connect(this.$$masterOut);
};

AudioMonoIO.prototype.$$crossBrowserAudioContext = function () {
    window.AudioContext =
        window.AudioContext ||
        window.webkitAudioContext ||
        window.mozAudioContext;
};

AudioMonoIO.prototype.$$crossBrowserMediaDevices = function () {
    var getUserMedia;

    // Code based on: 
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia

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

AudioMonoIO.prototype.$$logAndRethrow = function (error, message) {
    alert(message);
    console.log(error);
    throw error;
};

AudioMonoIO.prototype.$$createAudioContext = function () {
    var audioContext;

    try {
        audioContext = new window.AudioContext();
    } catch (error) {
        this.$$logAndRethrow(error, 'AudioContext creation failed');
    }

    return audioContext;
};

AudioMonoIO.prototype.$$connectMicrophoneTo = function (node) {
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

AudioMonoIO.prototype.$$onAudioProcessHandler = function (audioProcessingEvent) {
    var monoDataIn, monoDataOut;

    monoDataIn = audioProcessingEvent.inputBuffer.getChannelData(AudioMonoIO.$$_MONO_INDEX);
    monoDataOut = audioProcessingEvent.outputBuffer.getChannelData(AudioMonoIO.$$_MONO_INDEX);

    if (AudioMonoIO.$$isFunction(this.$$sampleInHandler)) {
        this.$$sampleInHandler(monoDataIn);
    }

    if (AudioMonoIO.$$isFunction(this.$$sampleOutHandler)) {
        this.$$sampleOutHandler(monoDataOut, monoDataIn);
    }
};

AudioMonoIO.prototype.$$setImmediately = function (audioParam, value) {
    var now = this.$$audioContext.currentTime;

    audioParam.value = value;
    audioParam.setValueAtTime(value, now);
};

AudioMonoIO.$$isFunction = function (variable) {
    return typeof variable === 'function';
};

AudioMonoIO.$$getValueOrDefault = function (value, defaultValue) {
    return typeof value !== 'undefined' ? value : defaultValue;
};

AudioMonoIO.prototype.setVolume = function (volume) {
    this.$$setImmediately(this.$$masterOutVolume.gain, volume);
};

AudioMonoIO.prototype.setLoopback = function (state) {
    state = !!state;

    if (this.$$loopbackEnabled === state) {
        return false;
    }

    this.$$sourceDetach();
    this.$$loopbackEnabled = state;
    this.$$sourceAttach();

    return true;
};

AudioMonoIO.prototype.setPeriodicWave = function (frequency, volume, phase, harmonicAmplitude, harmonicPhase) {
    var periodicWave;

    frequency = AudioMonoIO.$$getValueOrDefault(
        frequency, AudioMonoIO.$$_OUTPUT_WAVE_FREQUENCY
    );
    volume = AudioMonoIO.$$getValueOrDefault(
        volume, AudioMonoIO.$$_OUTPUT_WAVE_VOLUME
    );
    phase = AudioMonoIO.$$getValueOrDefault(
        phase, AudioMonoIO.$$_OUTPUT_WAVE_PHASE
    );
    harmonicAmplitude = AudioMonoIO.$$getValueOrDefault(
        harmonicAmplitude, AudioMonoIO.$$_OUTPUT_WAVE_HARMONIC_AMPLITUDE
    );
    harmonicPhase = AudioMonoIO.$$getValueOrDefault(
        harmonicPhase, AudioMonoIO.$$_OUTPUT_WAVE_HARMONIC_PHASE
    );

    this.$$setImmediately(this.$$outOscillator.frequency, frequency);
    this.$$setImmediately(this.$$outOscillatorGain.gain, volume);

    periodicWave = this.$$getPeriodicWave(
        phase,
        harmonicAmplitude,
        harmonicPhase
    );
    this.$$outOscillator.setPeriodicWave(periodicWave);
};

AudioMonoIO.prototype.$$getPeriodicWave = function (phase, harmonicAmplitude, harmonicPhase) {
    var
        real,
        imag,
        harmonicNumber,
        i,
        phaseRadianGlobal,
        phaseRadianLocal,
        finalRadian;

    if (harmonicAmplitude.length !== harmonicPhase.length) {
        throw 'Length of amplitude and phase arrays should match';
    }
    if (harmonicAmplitude.length < 1) {
        throw 'Amplitude and phase arrays should have at least one item';
    }

    real = new Float32Array(1 + harmonicAmplitude.length);
    imag = new Float32Array(1 + harmonicAmplitude.length);
    phaseRadianGlobal = 2 * Math.PI * (-phase);
    real[0] = 0;   // DC-offset is always zero
    imag[0] = 0;
    for (i = 0; i < harmonicAmplitude.length; i++) {
        harmonicNumber = 1 + i;
        phaseRadianLocal = 2 * Math.PI * (-harmonicPhase[i]);
        finalRadian = phaseRadianGlobal * harmonicNumber + phaseRadianLocal;
        real[harmonicNumber] = harmonicAmplitude[i] * Math.sin(finalRadian);
        imag[harmonicNumber] = harmonicAmplitude[i] * Math.cos(finalRadian);
    }

    return this.$$audioContext.createPeriodicWave(real, imag);
};

AudioMonoIO.prototype.setSampleInHandler = function (callback) {
    if (AudioMonoIO.$$isFunction(callback)) {
        this.$$sampleInHandler = callback.bind(callback);
    } else {
        this.$$sampleInHandler = null;
    }
};

AudioMonoIO.prototype.setSampleOutHandler = function (callback) {
    if (AudioMonoIO.$$isFunction(callback)) {
        this.$$sampleOutHandler = callback.bind(callback);
    } else {
        this.$$sampleOutHandler = null;
    }
};

AudioMonoIO.prototype.setFFTSize = function (fftSize) {
    this.$$fftSize = fftSize;
    if (this.$$inAnalyzer.fftSize !== this.$$fftSize) {
        this.$$inAnalyzer.fftSize = this.$$fftSize;
    }
};

AudioMonoIO.prototype.getFFTSize = function () {
    return this.$$fftSize;
};

AudioMonoIO.prototype.setSmoothingTimeConstant = function (smoothingTimeConstant) {
    this.$$smoothingTimeConstant = smoothingTimeConstant;
    if (this.$$inAnalyzer.smoothingTimeConstant !== this.$$smoothingTimeConstant) {
        this.$$inAnalyzer.smoothingTimeConstant = this.$$smoothingTimeConstant;
    }
};

AudioMonoIO.prototype.getFrequencyData = function () {
    var data;

    data = new Float32Array(this.$$inAnalyzer.frequencyBinCount);   // same as: 0.5 * fftSize
    this.$$inAnalyzer.getFloatFrequencyData(data);

    return data;
};

AudioMonoIO.prototype.getTimeDomainData = function () {
    var data;

    data = new Float32Array(this.$$inAnalyzer.fftSize);
    this.$$inAnalyzer.getFloatTimeDomainData(data);

    return data;
};

AudioMonoIO.prototype.getSampleRate = function () {
    return this.$$audioContext.sampleRate;
};

AudioMonoIO.prototype.getFFTResolution = function () {
    return this.getSampleRate() / this.getFFTSize();
};
