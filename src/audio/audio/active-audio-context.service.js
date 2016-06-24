// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Audio.ActiveAudioContext', _ActiveAudioContext);

    _ActiveAudioContext.$inject = [
        'Common.SimplePromiseBuilder'
    ];

    function _ActiveAudioContext(
        SimplePromiseBuilder
    ) {
        var
            context = null,
            rawMicrophoneNode = null,
            microphoneNode = null,
            recordedNode = null,
            recordedRawNode = null
        ;

        function getCurrentTime() {
            return context.currentTime;
        }

        function createAnalyser() {
            return context.createAnalyser();
        }

        function createGain() {
            return context.createGain();
        }

        function createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels) {
            return context.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);
        }

        function getSampleRate() {
            return context.sampleRate;
        }

        function getDestination() {
            return context.destination;
        }

        function getMicrophoneNode() {
            return microphoneNode;
        }

        function getRecordedAudioNode() {
            return recordedNode;
        }

        function loadRecordedAudio(url) {
            var
                request = new XMLHttpRequest(),
                promise = SimplePromiseBuilder.build();

            request.open('GET', url, true);
            request.responseType = 'arraybuffer';

            request.onload = function() {
                context.decodeAudioData(
                    request.response,
                    function(buffer) {
                        if (recordedRawNode) {
                            recordedRawNode.disconnect(recordedNode);
                        }

                        recordedRawNode = context.createBufferSource();
                        recordedRawNode.buffer = buffer;
                        recordedRawNode.connect(recordedNode);
                        recordedRawNode.loop = true;
                        recordedRawNode.start(0);

                        promise.resolve();
                    },
                    function (e) {
                        promise.reject(e);
                    }
                );
            };
            request.send();

            return promise;
        }

        function $$getConstraints() {
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
        }

        function $$normalizeGlobalVariable() {
            window.AudioContext =
                window.AudioContext ||
                window.webkitAudioContext ||
                window.mozAudioContext;
            navigator.getUserMedia =
                navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia;
        }

        function init() {
            $$normalizeGlobalVariable();

            try {
                context = new window.AudioContext();
            } catch (e) {
                alert('Web Audio API is not supported in this browser');
                console.log(e);
            }

            microphoneNode = context.createGain();
            recordedNode = context.createGain();
            try {
                navigator.getUserMedia(
                    $$getConstraints(),
                    function (stream) {
                        rawMicrophoneNode = context.createMediaStreamSource(stream);
                        rawMicrophoneNode.connect(microphoneNode);
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
        }

        init();

        return {
            loadRecordedAudio: loadRecordedAudio,
            getMicrophoneNode: getMicrophoneNode,
            getRecordedAudioNode: getRecordedAudioNode,
            getSampleRate: getSampleRate,
            getDestination: getDestination,
            getCurrentTime: getCurrentTime,
            createAnalyser: createAnalyser,
            createGain: createGain,
            createScriptProcessor: createScriptProcessor
        };
    }

})();
