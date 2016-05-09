(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.Audio', _Audio);

    _Audio.$inject = [];

    function _Audio() {
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

        function userMediaStreamSuccess(stream) {
            rawMicrophoneNode = context.createMediaStreamSource(stream);
            rawMicrophoneNode.connect(microphoneNode);
        }

        function loadRecordedAudio(url, successCallback, errorCallback) {
            var request = new XMLHttpRequest();

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

                        if (typeof successCallback === 'function') {
                            successCallback();
                        }
                    },
                    function (e) {
                        if (typeof errorCallback === 'function') {
                            errorCallback(e);
                        }
                    }
                );
            };
            request.send();
        }

        function init() {
            window.AudioContext = (function () {
                return window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
            })();
            navigator.getUserMedia = (
                navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia
            );

            try {
                context = new window.AudioContext();
            } catch (e) {
                alert('Web Audio API is not supported in this browser');
                console.log(e);
            }

            /*
             navigator.mediaDevices.getUserMedia(constraints)
             .then(function(mediaStream) { ... })
             .catch(function(error) { ... })
             */

            microphoneNode = context.createGain();
            recordedNode = context.createGain();
            try {
                navigator.getUserMedia(
                    {
                        video: false,
                        audio: {
                            mandatory: {
                                // echoCancellation: false,
                                googEchoCancellation: false, // disabling audio processing
                                googAutoGainControl: false,
                                googNoiseSuppression: false,
                                googHighpassFilter: false,
                                googTypingNoiseDetection: false
                                //googAudioMirroring: true
                            },
                            optional: []
                        }
                    },
                    userMediaStreamSuccess,
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
