var ConstellationDiagram = (function () {
    'use strict';

    _ConstellationDiagram.$inject = [];

    function _ConstellationDiagram() {
        var CD;
        
        CD = function (parentDiv, queue, width, height) {
            this.$$parentDiv = parentDiv;
            this.$$queue = queue;
            this.$$canvas = null;
            this.$$canvasContext = null;
            this.$$canvasWidth = width;
            this.$$canvasHeight = height;
            
            this.$$initAnimationFrame();
            this.$$init();
        };

        CD.prototype.$$init = function () {
            this.$$canvasContext = null;
            this.$$parentDiv.innerHTML = this.$$renderTemplate();
            this.$$connectTemplate();
            this.$$initCanvasContext();
        };

        CD.prototype.$$find = function (selector) {
            var jsObject = this.$$parentDiv.querySelectorAll(selector);

            if (jsObject.length === 0) {
                throw 'Cannot $$find given selector';
            }

            return jsObject[0];
        };

        CD.prototype.$$connectTemplate = function () {
            this.$$canvas = this.$$find('.constellation-diagram');
            this.$$canvasContext = this.$$canvas.getContext("2d");
        };


        CD.prototype.$$renderTemplate = function () {
            var tpl =
                '<div ' +
                '    class="constellation-diagram-container" ' +
                '    style="overflow: hidden; width: {{ width }}px; height: {{ height }}px; ' +
                '           position: relative; line-height: 10px; font-family: Tahoma; ' +
                '           color: red; font-size: 9px; outline: 1px solid gray;"' +
                '    >' +
                '    <canvas ' +
                '        class="constellation-diagram" ' +
                '        style="width: {{ width }}px; height: {{ height }}px; position: absolute;" ' +
                '        width="{{ width }}" height="{{ height }}"' +
                '        ></canvas>' +
                '</div>';

            tpl = tpl.replace(/\{\{ width \}\}/g, (this.$$canvasWidth).toString());
            tpl = tpl.replace(/\{\{ height \}\}/g, (this.$$canvasHeight).toString());

            return tpl;
        };

        CD.prototype.$$updateChart = function () {
            var
                ctx = this.$$canvasContext,
                w = this.$$canvasWidth,
                h = this.$$canvasHeight,
                halfW = 0.5 * this.$$canvasWidth,
                halfH = 0.5 * this.$$canvasHeight,
                q = this.$$queue,
                halfQSize = 0.5 * q.getSize(),
                color,
                x,
                y,
                i;

            if (ctx === null) {
                return;
            }

            ctx.clearRect(0, 0, w, h);
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
            for (i = 0; i < halfQSize; i++) {
                x = halfW + halfW * q.getItem(2 * i);
                y = halfH - halfH * q.getItem(2 * i + 1);
                color = 128 - 128 * (i / (halfQSize - 1));
                ctx.fillStyle = 'rgba(' + color + ', ' + color + ', 100, 1)';
                ctx.fillRect(x - 1, y - 1, 3, 3);
            }
        };

        CD.prototype.$$initCanvasContext = function () {
            this.$$canvasContext.lineWidth = 1;
            this.$$canvasContext.strokeStyle = 'rgba(128, 128, 128, 1)';
        };

        CD.prototype.$$initAnimationFrame = function () {
            var self = this;

            function drawAgain() {
                self.$$updateChart();
                requestAnimationFrame(drawAgain);
            }
            requestAnimationFrame(drawAgain);
        };

        return CD;
    }

    return _ConstellationDiagram();        // TODO change it to dependency injection

})();
