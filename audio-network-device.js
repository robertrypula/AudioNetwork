var AudioNetworkDevice = (function () {
    'use strict';

    _AudioNetworkDevice.$inject = [];

    function _AudioNetworkDevice() {
        /*
            queue = [
                {
                    channel: 'A',
                    signal: 1,
                    duration: 50        // in miliseconds
                },
                {
                    channel: 'A',
                    signal: 2,
                    duration: 50        // in miliseconds
                },
                {
                    channel: 'B',
                    signal: 1,
                    duration: 500       // in miliseconds
                }
            ]

        */
        function addSignal(queue) {

        }

        function getSignal() {
            return [
                {
                    channel: 'A',
                    signal: null
                },
                {
                    channel: 'B',
                    signal: 1
                }
            ]
        }

        return {
            addToQueue: addToQueue,
            getSignalState: getSignalState
        };
    }

    return new _AudioNetworkDevice();        // TODO change it to dependency injection

})();
