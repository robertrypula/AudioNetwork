// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
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

        $$init();

        return {
            loadRecordedAudio: simpleAudioContext.loadRecordedAudio.bind(simpleAudioContext),
            getMicrophoneNode: simpleAudioContext.getMicrophoneNode.bind(simpleAudioContext),
            getRecordedAudioNode: simpleAudioContext.getRecordedAudioNode.bind(simpleAudioContext),
            getSampleRate: simpleAudioContext.getSampleRate.bind(simpleAudioContext),
            getDestination: simpleAudioContext.getDestination.bind(simpleAudioContext),
            getCurrentTime: simpleAudioContext.getCurrentTime.bind(simpleAudioContext),
            createAnalyser: simpleAudioContext.createAnalyser.bind(simpleAudioContext),
            createGain: simpleAudioContext.createGain.bind(simpleAudioContext),
            createScriptProcessor: simpleAudioContext.createScriptProcessor.bind(simpleAudioContext)
        };
    }

})();
