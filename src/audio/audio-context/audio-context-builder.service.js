// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Audio.AudioContextBuilder', _AudioContextBuilder);

    _AudioContextBuilder.$inject = [
        'Audio.AudioContext'
    ];

    function _AudioContextBuilder(
        AudioContext
    ) {

        function build() {
            return new AudioContext();
        }

        return {
            build: build
        };
    }

})();
