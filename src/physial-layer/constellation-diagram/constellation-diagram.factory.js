var ConstellationDiagram = (function () {
    'use strict';

    _ConstellationDiagram.$inject = [];

    function _ConstellationDiagram() {
        var CD;

        CD = function (parentElement, queue, width, height, colorAxis, colorHistoryPoint) {
            this.$$parentElement = parentElement;
            this.$$queue = queue;
            this.$$canvas = null;
            this.$$canvasContext = null;
            this.$$canvasWidth = width;
            this.$$canvasHeight = height;
            this.$$colorAxis = colorAxis;
            this.$$colorHistoryPoint = colorHistoryPoint;
            this.$$destroy = false;
            
            this.$$initAnimationFrame();
            this.$$init();
        };

        CD.prototype.destroy = function () {
            this.$$destroy = true;
        };

        CD.prototype.$$init = function () {
            this.$$canvasContext = null;
            this.$$parentElement.innerHTML = this.$$renderTemplate();
            this.$$connectTemplate();
            this.$$initCanvasContext();
        };

        // TODO move it to dedicated service
        CD.prototype.$$find = function (selector) {
            var jsObject = this.$$parentElement.querySelectorAll(selector);

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
                '<div' +
                '    class="constellation-diagram-container"' +
                '    style="' +
                '        overflow: hidden;' +
                '        width: {{ width }}px;' +
                '        height: {{ height }}px;' +
                '        position: relative;' +
                '    "' +
                '    >' +
                '    <canvas ' +
                '        class="constellation-diagram"' +
                '        style="' +
                '            width: {{ width }}px;' +
                '            height: {{ height }}px;' +
                '            position: absolute;' +
                '        "' +
                '        width="{{ width }}"' +
                '        height="{{ height }}"' +
                '        ></canvas>' +
                '</div>';

            tpl = tpl.replace(/\{\{ width \}\}/g, (this.$$canvasWidth).toString());
            tpl = tpl.replace(/\{\{ height \}\}/g, (this.$$canvasHeight).toString());

            return tpl;
        };

        CD.prototype.$$updateChart = function () {
            var
                chp = this.$$colorHistoryPoint,
                ctx = this.$$canvasContext,
                w = this.$$canvasWidth,
                h = this.$$canvasHeight,
                halfW = 0.5 * this.$$canvasWidth,
                halfH = 0.5 * this.$$canvasHeight,
                q = this.$$queue,
                halfQSize,
                tailUnitPosition, color, x, y, i, isNewest
            ;

            if (this.$$destroy) {
                this.$$parentElement.innerHTML = '';
                return false;
            }

            if (ctx === null) {
                return true;
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

            halfQSize = 0.5 * q.getSize();

            // from oldest to newest
            for (i = 0; i < halfQSize; i++) {
                x = halfW + halfW * q.getItem(2 * i);
                y = halfH - halfH * q.getItem(2 * i + 1);
                tailUnitPosition = 1 - (i / (halfQSize - 2));
                isNewest = (i === halfQSize - 1);

                if (isNewest) {
                    color = (
                        'rgba(' + chp.red.newest + ', ' + chp.green.newest + ', ' + chp.blue.newest + ', ' + '1)'
                    );
                } else {
                    color = (
                        'rgba(' +
                        this.$$colorInterpolate(chp.red.tailNewest, chp.red.tailOldest, tailUnitPosition) + ', ' +
                        this.$$colorInterpolate(chp.green.tailNewest, chp.green.tailOldest, tailUnitPosition) + ', ' +
                        this.$$colorInterpolate(chp.blue.tailNewest, chp.blue.tailOldest, tailUnitPosition) + ', ' +
                        '1)'
                    );
                }

                ctx.fillStyle = color;
                ctx.fillRect(
                    x - (isNewest ? 2 : 1),
                    y - (isNewest ? 2 : 1),
                    (isNewest ? 5 : 3),
                    (isNewest ? 5 : 3)
                );
            }

            return true;
        };

        CD.prototype.$$colorInterpolate = function (start, end, unitPosition) {
            return Math.round(start + ((end - start) * unitPosition));
        };

        CD.prototype.$$initCanvasContext = function () {
            this.$$canvasContext.lineWidth = 1;
            this.$$canvasContext.strokeStyle = this.$$colorAxis;
        };

        CD.prototype.$$initAnimationFrame = function () {
            var self = this;

            function drawAgain() {
                if (self.$$updateChart()) {
                    requestAnimationFrame(drawAgain);
                }
            }
            requestAnimationFrame(drawAgain);
        };

        return CD;
    }

    return _ConstellationDiagram();        // TODO change it to dependency injection

})();
