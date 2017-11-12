// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Common.StopwatchBuilder', _StopwatchBuilder);

    _StopwatchBuilder.$inject = [
        'Common.Stopwatch'
    ];

    function _StopwatchBuilder(
        Stopwatch
    ) {

        function build() {
            return new Stopwatch();
        }


        return {
            build: build
        };
    }

})();
