var Audio = (function () {
    'use strict';

    _Audio.$inject = [];

    function _Audio() {
        var context = null;

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

        function init() {
            var AudioContext = window.AudioContext || window.webkitAudioContext;

            context = new AudioContext();
        }

        init();

        return {
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
