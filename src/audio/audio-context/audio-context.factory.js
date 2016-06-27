// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Audio.AudioContext', _AudioContext);

    _AudioContext.$inject = [
        'Common.SimplePromiseBuilder'
    ];

    function _AudioContext(
        SimplePromiseBuilder
    ) {
        var AudioContext;

        AudioContext = function () {
            this.$$context = null;
            this.$$rawMicrophoneNode = null;
            this.$$microphoneNode = null;
            this.$$recordedNode = null;
            this.$$recordedRawNode = null;
            this.$$init();
        };

        AudioContext.prototype.getCurrentTime = function () {
            return this.$$context.currentTime;
        };

        AudioContext.prototype.createAnalyser = function () {
            return this.$$context.createAnalyser();
        };

        AudioContext.prototype.createGain = function () {
            return this.$$context.createGain();
        };

        AudioContext.prototype.createScriptProcessor = function (bufferSize, numberOfInputChannels, numberOfOutputChannels) {
            return this.$$context.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);
        };

        AudioContext.prototype.getSampleRate = function () {
            return this.$$context.sampleRate;
        };

        AudioContext.prototype.getDestination = function () {
            return this.$$context.destination;
        };

        AudioContext.prototype.getMicrophoneNode = function () {
            return this.$$microphoneNode;
        };

        AudioContext.prototype.getRecordedAudioNode = function () {
            return this.$$recordedNode;
        };

        AudioContext.prototype.loadRecordedAudio = function (url) {
            var
                self = this,
                request = new XMLHttpRequest(),
                promise = SimplePromiseBuilder.build();

            request.open('GET', url, true);
            request.responseType = 'arraybuffer';

            request.onload = function() {
                self.$$context.decodeAudioData(
                    request.response,
                    function (buffer) {
                        if (self.$$recordedRawNode) {
                            self.$$recordedRawNode.disconnect(self.$$recordedNode);
                        }

                        self.$$recordedRawNode = self.$$context.createBufferSource();
                        self.$$recordedRawNode.buffer = buffer;
                        self.$$recordedRawNode.connect(self.$$recordedNode);
                        self.$$recordedRawNode.loop = true;
                        self.$$recordedRawNode.start(0);

                        promise.resolve();
                    },
                    function (e) {
                        promise.reject(e);
                    }
                );
            };
            request.send();

            return promise;
        };

        AudioContext.prototype.$$getConstraints = function () {
            return {
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
        };

        AudioContext.prototype.$$normalizeGlobalVariable = function () {
            window.AudioContext =
                window.AudioContext ||
                window.webkitAudioContext ||
                window.mozAudioContext;
            navigator.getUserMedia =
                navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia;
        };

        AudioContext.prototype.$$init = function () {
            var self = this;

            this.$$normalizeGlobalVariable();

            try {
                this.$$context = new window.AudioContext();
            } catch (e) {
                alert('Web Audio API is not supported in this browser');
                console.log(e);
            }

            this.$$microphoneNode = this.$$context.createGain();
            this.$$recordedNode = this.$$context.createGain();
            try {
                navigator.getUserMedia(
                    this.$$getConstraints(),
                    function (stream) {
                        self.$$rawMicrophoneNode = self.$$context.createMediaStreamSource(stream);
                        self.$$rawMicrophoneNode.connect(self.$$microphoneNode);
                    },
                    function (e) {
                        alert('Microphone initialization failed');
                        console.log(e);
                    }
                );
            } catch (e) {
                alert('Microphone initialization failed');
                console.log(e);
            }
        };

        return AudioContext;
    }

})();
