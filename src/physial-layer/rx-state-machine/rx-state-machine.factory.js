var RxStateMachine = (function () {
    'use strict';

    _RxStateMachine.$inject = [];

    _RxStateMachine.STATE = {
        IDLE: 'IDLE',
        SYMBOL: 'SYMBOL',
        SYNC: 'SYNC',
        GUARD: 'GUARD'
    };

    function _RxStateMachine() {
        var RSM;

        RSM = function (handlerIddle, handlerSymbol, handlerSync, handlerGuard) {
            this.$$stateHandler = {};
            this.$$stateHandler[_RxStateMachine.STATE.IDLE] = handlerIddle;
            this.$$stateHandler[_RxStateMachine.STATE.SYMBOL] = handlerSymbol;
            this.$$stateHandler[_RxStateMachine.STATE.SYNC] = handlerSync;
            this.$$stateHandler[_RxStateMachine.STATE.GUARD] = handlerGuard;
            this.$$state = _RxStateMachine.STATE.IDLE;
            this.$$stateDurationTime = 0;
            this.$$stateBeginTime = null;
            this.$$symbolStateMaxDurationTime = 1.0;         // TODO change it
            this.$$guardStateMaxDurationTime = 1.0;         // TODO change it
        };

        RSM.prototype.$$changeState = function (newState, time) {
            if (newState !== null) {
                this.$$state = newState;
                this.$$stateBeginTime = time;
            } else {
                this.$$stateDurationTime = time - this.$$receiveStateBegin;
            }
        }

        RSM.prototype.$$handlerIddle = function (symbolData, time) {
            if (symbolData.symbol !== null) {
                this.$$changeState(_RxStateMachine.STATE.SYMBOL, time);
                return false;
            } else {
                this.$$changeState(null, time);

                // run external handler
                this.$$stateHandler[_RxStateMachine.STATE.IDLE](this.$$stateDurationTime);
            }

            return true;
        };

        RSM.prototype.$$handlerSymbol = function (symbolData, time) {
            if (symbolData.symbol === null) {
                this.$$changeState(_RxStateMachine.STATE.GUARD, time);
                return false;
            } else {
                this.$$changeState(null, time);

                // run external handler
                this.$$stateHandler[_RxStateMachine.STATE.SYMBOL](this.$$stateDurationTime, symbolData);

                if (this.$$stateDurationTime > this.$$symbolStateMaxDurationTime) {
                    this.$$changeState(_RxStateMachine.STATE.SYNC, time);
                    return false;
                }
            }

            return true;
        };

        RSM.prototype.$$handlerSync = function (symbolData, time) {
            if (symbolData.symbol === null) {
                this.$$changeState(_RxStateMachine.STATE.IDLE, time);
                return false;
            } else {
                this.$$changeState(null, time);

                // -> sync handler
            }

            return true;
        };

        RSM.prototype.$$handlerGuard = function (symbolData, time) {
            var symbolWithBestQuality;

            if (symbolData.symbol !== null) {
                this.$$changeState(_RxStateMachine.STATE.SYMBOL, time);
                return false;
            } else {
                this.$$changeState(null, time);

                // -> guard handler

                if (this.$$stateDurationTime > this.$$guardStateMaxDurationTime) {
                    this.$$changeState(_RxStateMachine.STATE.IDLE, time);
                    return false;
                }
            }
        };

        RSM.prototype.tryToChangeState = function (symbolData, time) {
            var
                S = _RxStateMachine.STATE,
                finished
            ;

            while (true) {
                switch (state) {
                    case S.IDLE:
                        finished = this.$$handlerIddle(symbolData, time);
                        break;
                    case S.SYMBOL:
                        finished = this.$$handlerSymbol(symbolData, time);
                        break;
                    case S.SYNC:
                        finished = this.$$handlerSync(symbolData, time);
                        break;
                    case S.GUARD:
                        finished = this.$$handlerGuard(symbolData, time);
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
