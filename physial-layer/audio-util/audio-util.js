var AudioUtil = (function () {
    'use strict';

    _AudioUtil.$inject = [];

    function _AudioUtil() {

         function findUnitAngle(x, y) {
            var length, q, angle;

            length = Math.sqrt(x * x + y * y);
            length = (length < 0.000001) ? 0.000001 : length;    // prevents from dividing by zero
            q = (y >= 0) ? (x >= 0 ? 0 : 1) : (x < 0 ? 2 : 3);
            switch (q) {
                case 0:
                    angle = Math.asin(y / length);
                    break;
                case 1:
                    angle = Math.asin(-x / length) + 0.5 * Math.PI;
                    break;
                case 2:
                    angle = Math.asin(-y / length) + Math.PI;
                    break;
                case 3:
                    angle = Math.asin(x / length) + 1.5 * Math.PI;
                    break;
            }

            return angle / (2 * Math.PI);
        }

        function unitFade(x) {
            x  = x < 0 ? 0 : x;
            x  = x > 1 ? 1 : x;

            return 0.5 * (Math.sin((x - 0.5) * Math.PI) + 1);
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
                 queue.splice(0, 1);
            }

            return queueItem;
        }

        return {
            findUnitAngle: findUnitAngle,
            unitFade: unitFade,
            queueAdd: queueAdd,
            queuePop: queuePop
        };
    }

    return new _AudioUtil();        // TODO change it to dependency injection

})();
