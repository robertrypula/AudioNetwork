// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Audio.ActiveAudioContext', _ActiveAudioContext);

    _ActiveAudioContext.$inject = [
        'Audio.SimpleAudioContextBuilder'
    ];

    function _ActiveAudioContext(
        SimpleAudioContextBuilder
    ) {
        var simpleAudioContext = null;

        function $$init() {
            simpleAudioContext = SimpleAudioContextBuilder.build();
        }

        function initializeCheck() {
            if (simpleAudioContext === null) {
                $$init();
            }
        }

        function loadRecordedAudio(url) {
            initializeCheck();
            return simpleAudioContext.loadRecordedAudio(url);
        }

        function getMicrophoneNode() {
            initializeCheck();
            return simpleAudioContext.getMicrophoneNode();
        }

        function getRecordedAudioNode() {
            initializeCheck();
            return simpleAudioContext.getRecordedAudioNode();
        }

        function getSampleRate() {
            initializeCheck();
            return simpleAudioContext.getSampleRate();
        }

        function getDestination() {
            initializeCheck();
            return simpleAudioContext.getDestination();
        }

        function getCurrentTime() {
            initializeCheck();
            return simpleAudioContext.getCurrentTime();
        }

        function createAnalyser() {
            initializeCheck();
            return simpleAudioContext.createAnalyser();
        }

        function createGain() {
            initializeCheck();
            return simpleAudioContext.createGain();
        }

        function createScriptProcessor() {
            initializeCheck();
            return simpleAudioContext.createScriptProcessor();
        }

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
