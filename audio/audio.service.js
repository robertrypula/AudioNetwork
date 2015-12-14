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

        function createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels) {
            return context.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);
        }

        function init() {
            var AudioContext = window.AudioContext || window.webkitAudioContext;

            context = new AudioContext();
        }

        init();

        return {
            sampleRate: context.sampleRate,
            destination: context.destination,
            getCurrentTime: getCurrentTime,
            createAnalyser: createAnalyser,
            createBiquadFilter: createBiquadFilter,
            createOscillator: createOscillator,
            createScriptProcessor: createScriptProcessor,
            getContext: getContext
        };
    }

    return new _Audio();        // TODO change it to dependency injection

})();
