var Util = (function () {
    'use strict';

    _Util.$inject = [];

    function _Util() {

        function valueOrDefault(value, defaultValue) {
            return typeof value !== 'undefined' ? value : defaultValue;
        }

        function accessor(element, path) {
            var
                pathList = path.split('.'),
                result = element,
                i
            ;

            if (!element) {
                return undefined;
            }

            for (i = 0; i < pathList.length; i++) {
                result = result[pathList[i]];
                if (!result) {
                    break;
                }
            }

            return result;
        }

        function computeAverage(list) {
            var i, sum;

            if (!list || list.length === 0) {
                return 0;
            }
            sum = 0;
            for (i = 0; i < list.length; i++) {
                sum += list[i];
            }

            return sum / list.length;
        }

        function findUnitAngle(x, y) {
            var length, q, angle;

            length = MathUtil.sqrt(x * x + y * y);
            length = (length < 0.000001) ? 0.000001 : length;    // prevents from dividing by zero
            q = (y >= 0) ? (x >= 0 ? 0 : 1) : (x < 0 ? 2 : 3);
            switch (q) {
                case 0:
                    angle = MathUtil.asin(y / length);
                    break;
                case 1:
                    angle = MathUtil.asin(-x / length) + MathUtil.HALF_PI;
                    break;
                case 2:
                    angle = MathUtil.asin(-y / length) + MathUtil.PI;
                    break;
                case 3:
                    angle = MathUtil.asin(x / length) + 1.5 * MathUtil.PI;
                    break;
            }

            return angle / MathUtil.TWO_PI;
        }

        function unitFade(x) {
            x  = x < 0 ? 0 : x;
            x  = x > 1 ? 1 : x;

            return 0.5 * (MathUtil.sin((x - 0.5) * MathUtil.PI) + 1);
        }

        function queueAdd(queue, itemList, copyCallback, amountFieldName) {
            var i, item, queueItem;

            amountFieldName = amountFieldName === undefined ? 'duration' : amountFieldName;

            for (i = 0; i < itemList.length; i++) {
                item = itemList[i];

                if (item[amountFieldName] <= 0) {
                    continue;
                }
                queueItem = {};
                queueItem[amountFieldName] = item[amountFieldName];
                copyCallback(queueItem, item);
                queue.push(queueItem);
            }
        }

        function queuePop(queue, amountFieldName) {
            var queueItem;

            amountFieldName = amountFieldName === undefined ? 'duration' : amountFieldName;

            if (queue.length === 0) {
                return null;
            }

            queue[0][amountFieldName]--;
            queueItem = queue[0];
            if (queue[0][amountFieldName] === 0) {
                // TODO check performance, maybe it's better to just keep track
                // of used elements and delete array at the end
                 queue.splice(0, 1);
            }

            return queueItem;
        }

        function findMaxValueIndex(list, accessorString) {
            var
                maxValue = null,
                index = null,
                i, value
            ;

            if (!list) {
                return null;
            }

            for (i = 0; i < list.length; i++) {
                value = accessor(list[i], accessorString);
                if (index === null || value > maxValue) {
                    maxValue = value;
                    index = i;
                }
            }

            return index;
        }

        return {
            valueOrDefault: valueOrDefault,
            accessor: accessor,
            computeAverage: computeAverage,
            findUnitAngle: findUnitAngle,
            unitFade: unitFade,
            queueAdd: queueAdd,
            queuePop: queuePop,
            findMaxValueIndex: findMaxValueIndex
        };
    }

    return new _Util();        // TODO change it to dependency injection

})();
