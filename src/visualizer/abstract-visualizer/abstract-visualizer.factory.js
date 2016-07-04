// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Visualizer.AbstractVisualizer', _AbstractVisualizer);

    _AbstractVisualizer.$inject = [
        'Common.SimplePromiseBuilder'
    ];

    function _AbstractVisualizer(
        SimplePromiseBuilder
    ) {
        var AbstractVisualizer;

        AbstractVisualizer = function (parentElement, width, height) {
            this.$$parentElement = parentElement;
            this.$$width = width;
            this.$$height = height;
            this.$$canvasContext = null;
            this.$$destroyPromise = null;

            this.$$parentElement.innerHTML = this.$$renderTemplate();
            this.$$initCanvas();
            requestAnimationFrame(this.$$animationFrameHandler.bind(this));     // TODO wrap requestAnimationFrame
        };

        AbstractVisualizer.ABSTRACT_METHOD_CALLED_EXCEPTION = 'Abstract method called!';

        AbstractVisualizer.prototype.destroy = function () {
            if (this.$$destroyPromise) {
                return this.$$destroyPromise;
            }
            this.$$destroyPromise = SimplePromiseBuilder.build();

            return this.$$destroyPromise;
        };


        // TODO move it to dedicated service
        AbstractVisualizer.prototype.$$find = function (selector) {
            var jsObject = this.$$parentElement.querySelectorAll(selector);

            if (jsObject.length === 0) {
                throw 'Cannot $$find given selector';
            }

            return jsObject[0];
        };

        AbstractVisualizer.prototype.$$initCanvas = function () {
            var canvasElement = this.$$find('canvas');

            this.$$canvasContext = canvasElement.getContext("2d");
        };

        AbstractVisualizer.prototype.$$animationFrameHandler = function () {
            if (this.$$destroyPromise) {
                this.$$parentElement.innerHTML = '';
                this.$$destroyPromise.resolve();
            } else {
                if (this.$$canvasContext) {
                    this.$$draw();
                }
                requestAnimationFrame(this.$$animationFrameHandler.bind(this));
            }
        };

        AbstractVisualizer.prototype.$$draw = function () {
            throw AbstractVisualizer.ABSTRACT_METHOD_CALLED_EXCEPTION;
        };

        AbstractVisualizer.prototype.$$renderTemplate = function () {
            throw AbstractVisualizer.ABSTRACT_METHOD_CALLED_EXCEPTION;
        };

        return AbstractVisualizer;
    }

})();
