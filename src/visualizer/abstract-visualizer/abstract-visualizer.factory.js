// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Visualizer.AbstractVisualizer', _AbstractVisualizer);

    _AbstractVisualizer.$inject = [
    ];

    function _AbstractVisualizer(
    ) {
        var AbstractVisualizer;

        AbstractVisualizer = function () {
        };

        AbstractVisualizer.prototype.test = function () {
        };

        return AbstractVisualizer;
    }

})();
