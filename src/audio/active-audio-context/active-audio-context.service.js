// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Audio.ActiveAudioContext', _ActiveAudioContext);

    _ActiveAudioContext.$inject = [
        'Audio.AudioContextBuilder'
    ];

    function _ActiveAudioContext(
        AudioContextBuilder
    ) {
        var audioContext = null;

        function $$init() {
            audioContext = AudioContextBuilder.build();
        }

        $$init();

        return {
            loadRecordedAudio: audioContext.loadRecordedAudio.bind(audioContext),
            getMicrophoneNode: audioContext.getMicrophoneNode.bind(audioContext),
            getRecordedAudioNode: audioContext.getRecordedAudioNode.bind(audioContext),
            getSampleRate: audioContext.getSampleRate.bind(audioContext),
            getDestination: audioContext.getDestination.bind(audioContext),
            getCurrentTime: audioContext.getCurrentTime.bind(audioContext),
            createAnalyser: audioContext.createAnalyser.bind(audioContext),
            createGain: audioContext.createGain.bind(audioContext),
            createScriptProcessor: audioContext.createScriptProcessor.bind(audioContext)
        };
    }

})();
