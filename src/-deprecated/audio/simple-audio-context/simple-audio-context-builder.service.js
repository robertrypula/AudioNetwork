// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Audio.SimpleAudioContextBuilder', _SimpleAudioContextBuilder);

    _SimpleAudioContextBuilder.$inject = [
        'Audio.SimpleAudioContext'
    ];

    function _SimpleAudioContextBuilder(
        SimpleAudioContext
    ) {

        function build() {
            return new SimpleAudioContext();
        }

        return {
            build: build
        };
    }

})();
