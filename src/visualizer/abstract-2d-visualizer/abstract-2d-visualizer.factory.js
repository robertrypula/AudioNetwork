// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Visualizer.Abstract2DVisualizer', _Abstract2DVisualizer);

    _Abstract2DVisualizer.$inject = [
        'Visualizer.AbstractVisualizer',
        'Common.Util'
    ];

    function _Abstract2DVisualizer(
        AbstractVisualizer,
        Util
    ) {
        var Abstract2DVisualizer;

        Abstract2DVisualizer = function (parentElement, width, height, colorAxis, colorCenteredCircle) {
            AbstractVisualizer.call(this, parentElement, width, height);

            this.$$colorAxis = Util.valueOrDefault(colorAxis, 'green');
            this.$$colorCenteredCircle = Util.valueOrDefault(colorCenteredCircle, '#DDD');
        };

        Abstract2DVisualizer.prototype = Object.create(AbstractVisualizer.prototype);
        Abstract2DVisualizer.prototype.constructor = Abstract2DVisualizer;

        Abstract2DVisualizer.prototype.$$drawCenteredCircle = function (radius) {
            var
                ctx = this.$$canvasContext,
                halfW = 0.5 * this.$$width,
                halfH = 0.5 * this.$$height;

            ctx.strokeStyle = this.$$colorCenteredCircle;
            ctx.beginPath();
            ctx.arc(
                halfW, halfH,
                radius,
                0, 2 * Math.PI, false
            );
            ctx.stroke();
        };

        Abstract2DVisualizer.prototype.$$drawAxis = function () {
            var
                ctx = this.$$canvasContext,
                w = this.$$width,
                h = this.$$height,
                halfW = 0.5 * w,
                halfH = 0.5 * h;

            ctx.strokeStyle = this.$$colorAxis;
            ctx.beginPath();
            ctx.moveTo(0, halfH);
            ctx.lineTo(w, halfH);
            ctx.closePath();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(halfW, 0);
            ctx.lineTo(halfW, h);
            ctx.closePath();
            ctx.stroke();
        };

        Abstract2DVisualizer.prototype.$$dropXYCache = function () {
            var i;

            for (i = 0; i < this.$$queue.getSize(); i++) {
                delete this.$$queue.getItem(i).$$cache;
            }
        };

        return Abstract2DVisualizer;
    }

})();
