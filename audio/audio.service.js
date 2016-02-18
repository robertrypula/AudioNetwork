var Audio = (function () {
    'use strict';

    _Audio.$inject = [];

    function _Audio() {
        var
            context = null,
            microfoneNode = null,
            microfoneSplitterNode = null,
            microfoneMergerNode = null
        ;

        function getContext() {
            return context;
        }

        function getCurrentTime() {
            return context.currentTime;
        }

        function createAnalyser() {
            return context.createAnalyser();
        }

        function createBiquadFilter() {
            return context.createBiquadFilter();
        }

        function createOscillator() {
            return context.createOscillator();
        }

        function createGain() {
            return context.createGain();
        }

        function createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels) {
            return context.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);
        }

        function createChannelMerger(numberOfInputs) {
            return context.createChannelMerger(numberOfInputs);
        }

        function getSampleRate() {
            return context.sampleRate;
        }

        function getMicrofoneNode() {
            return microfoneNode;
        }

        function userMediaStreamSuccess(stream) {
            var rawMicrofoneNode = context.createMediaStreamSource(stream);

            microfoneSplitterNode = context.createChannelSplitter(2);
            microfoneMergerNode = context.createChannelMerger(2);
            rawMicrofoneNode.connect(microfoneSplitterNode);
            microfoneSplitterNode.connect(microfoneMergerNode, 0, 0);
            microfoneSplitterNode.connect(microfoneMergerNode, 0, 1);
            microfoneMergerNode.connect(microfoneNode);
        }

        function init() {
            var AudioContext = window.AudioContext || window.webkitAudioContext;

            context = new AudioContext();
            microfoneNode = context.createGain();

            if (!navigator.getUserMedia) {
                navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
            }
            navigator.getUserMedia(
                {
                    audio: {
                        mandatory: {
                            googEchoCancellation: false,
                            googAutoGainControl: false,
                            googNoiseSuppression: false,
                            googHighpassFilter: false
                        },
                        optional: []
                    }
                },
                userMediaStreamSuccess,
                function(e) {
                    alert('Error getting audio');
                    console.log(e);
                }
            );
        }

        init();

        return {
            getMicrofoneNode: getMicrofoneNode,
            getSampleRate: getSampleRate,
            destination: context.destination,
            getCurrentTime: getCurrentTime,
            createAnalyser: createAnalyser,
            createBiquadFilter: createBiquadFilter,
            createOscillator: createOscillator,
            createGain: createGain,
            createScriptProcessor: createScriptProcessor,
            createChannelMerger: createChannelMerger,
            getContext: getContext
        };
    }

    return new _Audio();        // TODO change it to dependency injection

})();
