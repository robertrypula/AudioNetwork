// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var AudioMonoIOLite;

AudioMonoIOLite = function (bufferSize) {
    this.$$audioContext = null;
    this.$$microphone = null;
    this.$$sampleProcessor = null;

    this.$$bufferSize = AudioMonoIOLite.$$getValueOrDefault(
        bufferSize,
        AudioMonoIOLite.BUFFER_SIZE
    );
    this.$$sampleInHandler = null;
    this.$$sampleOutHandler = null;

    this.$$initialize();
};

AudioMonoIOLite.$$firstInstance = true;

AudioMonoIOLite.$$_MONO = 1;
AudioMonoIOLite.$$_MONO_INDEX = 0;

AudioMonoIOLite.BUFFER_SIZE = 4 * 1024;

AudioMonoIOLite.prototype.$$initialize = function () {
    this.$$normalizeBrowserApi();
    this.$$audioContext = this.$$createAudioContext();

    this.$$sampleProcessor = this.$$audioContext.createScriptProcessor(
        this.$$bufferSize,
        AudioMonoIOLite.$$_MONO,
        AudioMonoIOLite.$$_MONO
    );
    this.$$sampleProcessor.onaudioprocess = this.$$onAudioProcessHandler.bind(this);

    this.$$connectMicrophoneTo(this.$$sampleProcessor);
    this.$$sampleProcessor.connect(this.$$audioContext.destination);
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

AudioMonoIOLite.prototype.$$onAudioProcessHandler = function (audioProcessingEvent) {
    var monoDataIn, monoDataOut;

    monoDataIn = audioProcessingEvent.inputBuffer.getChannelData(AudioMonoIOLite.$$_MONO_INDEX);
    monoDataOut = audioProcessingEvent.outputBuffer.getChannelData(AudioMonoIOLite.$$_MONO_INDEX);

    if (AudioMonoIOLite.$$isFunction(this.$$sampleInHandler)) {
        this.$$sampleInHandler(monoDataIn);
    }

    if (AudioMonoIOLite.$$isFunction(this.$$sampleOutHandler)) {
        this.$$sampleOutHandler(monoDataOut, monoDataIn);
    }
};

AudioMonoIOLite.$$isFunction = function (variable) {
    return typeof variable === 'function';
};

AudioMonoIOLite.$$getValueOrDefault = function (value, defaultValue) {
    return typeof value !== 'undefined' ? value : defaultValue;
};

AudioMonoIOLite.prototype.setSampleInHandler = function (callback) {
    if (AudioMonoIOLite.$$isFunction(callback)) {
        this.$$sampleInHandler = callback.bind(callback);
    } else {
        this.$$sampleInHandler = null;
    }
};

AudioMonoIOLite.prototype.setSampleOutHandler = function (callback) {
    if (AudioMonoIOLite.$$isFunction(callback)) {
        this.$$sampleOutHandler = callback.bind(callback);
    } else {
        this.$$sampleOutHandler = null;
    }
};

AudioMonoIOLite.prototype.getSampleRate = function () {
    return this.$$audioContext.sampleRate;
};
