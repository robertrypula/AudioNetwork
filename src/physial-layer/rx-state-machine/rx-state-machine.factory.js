var RxStateMachine = (function () {
    'use strict';

    _RxStateMachine.$inject = [];

    _RxStateMachine.STATE = {
        IDLE: 'IDLE',
        SYMBOL: 'SYMBOL',
        SYNC: 'SYNC',
        GUARD: 'GUARD',
        ERROR: 'ERROR'
    };

    function _RxStateMachine() {
        var
            RSM,
            state = _RxStateMachine.STATE.IDLE,
            symbolData = [],
            packetData = [],
            stateDurationTime = 0,
            stateBeginTime = null
        ;

        RSM = function () {
            this.$$stateHandler = {};
        };

        /*
         if (symbolData.symbol !== null) {
         receiveSamplerState = RECEIVE_SAMPLE_STATE.SYMBOL;
         receiveStateBegin = time;
         receiveSamplerSymbol(symbolData, time);
         } else {
         receiveStateDuration = time - receiveStateBegin;
         */

        RSM.prototype.tryToChangeState = function () {
            var
                S = _RxStateMachine.STATE,
                finished
            ;

            while (true) {
                switch (state) {
                    case S.IDLE:
                        break;
                    case S.SYMBOL:
                        break;
                    case S.SYNC:
                        break;
                    case S.GUARD:
                        break;
                    case S.ERROR:
                        break;
                }

                if (finished) {
                    break;
                }
            }
        };

        return RSM;
    }

    return _RxStateMachine();        // TODO change it to dependency injection

})();
