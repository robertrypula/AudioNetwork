// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

/**
 * Lite version of AudioMonoIO class. It wraps ScriptProcessorNode
 * only in order to provide RAW samples. So far only for mobile
 * device testing purposes.
 */

var AudioMonoIOLite;

AudioMonoIOLite = function (bufferSize) {
    this.$$audioContext = null;
    this.$$microphone = null;
    this.$$microphoneVirtual = null;
    this.$$sampleInProcessor = null;   // loopback was not working when we had one ScriptProcessor for IN and OUT
    this.$$sampleOutProcessor = null;
    this.$$volume = null;

    this.$$bufferSize = AudioMonoIOLite.$$getValueOrDefault(
        bufferSize,
        AudioMonoIOLite.BUFFER_SIZE
    );
    this.$$loopback = false;
    this.$$sampleInHandler = null;
    this.$$sampleOutHandler = null;

    this.$$initialize();
};

AudioMonoIOLite.$$firstInstance = true;

AudioMonoIOLite.$$_MONO = 1;
AudioMonoIOLite.$$_MONO_INDEX = 0;
AudioMonoIOLite.$$_NO_CHANNEL = 0;

AudioMonoIOLite.BUFFER_SIZE = 4 * 1024;

AudioMonoIOLite.prototype.$$initialize = function () {
    this.$$normalizeBrowserApi();
    this.$$audioContext = this.$$createAudioContext();
    this.$$microphoneVirtual = this.$$audioContext.createGain();
    this.$$volume = this.$$audioContext.createGain();
    this.$$volume.connect(this.$$audioContext.destination);
};

AudioMonoIOLite.prototype.$$normalizeBrowserApi = function () {
    if (AudioMonoIOLite.$$firstInstance) {
        this.$$crossBrowserAudioContext();
        this.$$crossBrowserMediaDevices();
        AudioMonoIOLite.$$firstInstance = false;
    }
};

AudioMonoIOLite.prototype.$$crossBrowserAudioContext = function () {
    window.AudioContext =
        window.AudioContext ||
        window.webkitAudioContext ||
        window.mozAudioContext;
};

AudioMonoIOLite.prototype.$$crossBrowserMediaDevices = function () {
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

AudioMonoIOLite.prototype.$$logAndRethrow = function (error, message) {
    alert(message);
    console.log(error);
    throw error;
};

AudioMonoIOLite.prototype.$$createAudioContext = function () {
    var audioContext;

    try {
        audioContext = new window.AudioContext();
    } catch (error) {
        this.$$logAndRethrow(error, 'AudioContext creation failed');
    }

    return audioContext;
};

AudioMonoIOLite.prototype.$$connectMicrophoneTo = function (node) {
    var
        self = this,
        constraints = {   // TODO investigate more on this
            video: false,
            audio: true
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

AudioMonoIOLite.prototype.$$onAudioProcessInHandler = function (audioProcessingEvent) {
    var monoDataIn;

    if (AudioMonoIOLite.$$isFunction(this.$$sampleInHandler)) {
        monoDataIn = audioProcessingEvent
            .inputBuffer
            .getChannelData(AudioMonoIOLite.$$_MONO_INDEX);
        this.$$sampleInHandler(monoDataIn);
    }
};

AudioMonoIOLite.prototype.$$onAudioProcessOutHandler = function (audioProcessingEvent) {
    var monoDataOut;

    if (AudioMonoIOLite.$$isFunction(this.$$sampleOutHandler)) {
        monoDataOut = audioProcessingEvent
            .outputBuffer
            .getChannelData(AudioMonoIOLite.$$_MONO_INDEX);
        this.$$sampleOutHandler(monoDataOut);
    }
};

AudioMonoIOLite.$$isFunction = function (variable) {
    return typeof variable === 'function';
};

AudioMonoIOLite.$$getValueOrDefault = function (value, defaultValue) {
    return typeof value !== 'undefined' ? value : defaultValue;
};

AudioMonoIOLite.prototype.$$setImmediately = function (audioParam, value) {
    var now = this.$$audioContext.currentTime;

    audioParam.value = value;
    audioParam.setValueAtTime(value, now);
};

AudioMonoIOLite.prototype.setLoopback = function (state) {
    if (this.$$loopback === !!state) {
        return;
    }

    this.$$lazyLoadSampleInProcessor();

    if (this.$$loopback) {
        this.$$volume.disconnect(this.$$sampleInProcessor);
        this.$$volume.connect(this.$$audioContext.destination);
        this.$$microphoneVirtual.connect(this.$$sampleInProcessor);
    } else {
        this.$$microphoneVirtual.disconnect(this.$$sampleInProcessor);
        this.$$volume.disconnect(this.$$audioContext.destination);
        this.$$volume.connect(this.$$sampleInProcessor);
    }

    this.$$loopback = !!state;
};

AudioMonoIOLite.prototype.setVolume = function (volume) {
    this.$$setImmediately(this.$$volume.gain, volume);
};

AudioMonoIOLite.prototype.$$lazyLoadSampleInProcessor = function () {
    if (this.$$sampleInProcessor) {
        return;
    }

    this.$$sampleInProcessor = this.$$audioContext.createScriptProcessor(
        this.$$bufferSize,
        AudioMonoIOLite.$$_MONO,
        AudioMonoIOLite.$$_MONO  // required because of Chrome bug - should be set to zero
    );
    this.$$sampleInProcessor.onaudioprocess = this.$$onAudioProcessInHandler.bind(this);
    this.$$sampleInProcessor.connect(this.$$audioContext.destination); // required in Chrome
    this.$$microphoneVirtual.connect(this.$$sampleInProcessor);
    this.$$connectMicrophoneTo(this.$$microphoneVirtual);
};

AudioMonoIOLite.prototype.$$lazyLoadSampleOutProcessor = function () {
    if (this.$$sampleOutProcessor) {
        return;
    }

    this.$$sampleOutProcessor = this.$$audioContext.createScriptProcessor(
        this.$$bufferSize,
        AudioMonoIOLite.$$_NO_CHANNEL,
        AudioMonoIOLite.$$_MONO
    );
    this.$$sampleOutProcessor.onaudioprocess = this.$$onAudioProcessOutHandler.bind(this);
    this.$$sampleOutProcessor.connect(this.$$volume);
};

AudioMonoIOLite.prototype.setSampleInHandler = function (callback) {
    if (AudioMonoIOLite.$$isFunction(callback)) {
        this.$$lazyLoadSampleInProcessor();
        this.$$sampleInHandler = callback.bind(callback);
    } else {
        this.$$sampleInHandler = null;
    }
};

AudioMonoIOLite.prototype.setSampleOutHandler = function (callback) {
    if (AudioMonoIOLite.$$isFunction(callback)) {
        this.$$lazyLoadSampleOutProcessor();
        this.$$sampleOutHandler = callback.bind(callback);
    } else {
        this.$$sampleOutHandler = null;
    }
};

AudioMonoIOLite.prototype.getSampleRate = function () {
    return this.$$audioContext.sampleRate;
};
