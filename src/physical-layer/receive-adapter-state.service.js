var ReceiveAdapterState = (function () {
    'use strict';

    _ReceiveAdapterState.$inject = [];

    function _ReceiveAdapterState() {
        return {
            NO_INPUT: 'NO_INPUT',
            IDLE_INIT: 'IDLE_INIT',
            FIRST_SYNC_WAIT: 'FIRST_SYNC_WAIT',
            FIRST_SYNC: 'FIRST_SYNC',
            FATAL_ERROR: 'FATAL_ERROR',
            IDLE: 'IDLE',
            SYMBOL: 'SYMBOL',
            SYNC: 'SYNC',
            GUARD: 'GUARD',
            ERROR: 'ERROR'
        };
    }

    return new _ReceiveAdapterState();        // TODO change it to dependency injection

})();
