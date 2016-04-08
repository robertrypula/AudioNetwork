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
        var RSM;

        RSM = function (handlerIdle, handlerSymbol, handlerSync, handlerGuard, handlerError) {
            this.$$stateHandler = {};
            this.$$stateHandler[_RxStateMachine.STATE.IDLE] = handlerIdle;
            this.$$stateHandler[_RxStateMachine.STATE.SYMBOL] = handlerSymbol;
            this.$$stateHandler[_RxStateMachine.STATE.SYNC] = handlerSync;
            this.$$stateHandler[_RxStateMachine.STATE.GUARD] = handlerGuard;
            this.$$stateHandler[_RxStateMachine.STATE.ERROR] = handlerError;
            this.$$state = _RxStateMachine.STATE.IDLE;
            this.$$stateDurationTime = 0;
            this.$$stateBeginTime = null;
            this.$$symbolStateMaxDurationTime = null;
            this.$$guardStateMaxDurationTime = null;
            this.$$syncStateMaxDurationTime = null;
        };

        RSM.prototype.$$changeState = function (newState, time) {
            if (newState !== null) {
                this.$$state = newState;
                this.$$stateBeginTime = time;
            } else {
                this.$$stateDurationTime = time - this.$$stateBeginTime;
            }
        };

        RSM.prototype.$$handlerIdle = function (symbolData, time) {
            if (symbolData.symbol !== null) {
                this.$$changeState(_RxStateMachine.STATE.SYMBOL, time);
                return false;
            } else {
                this.$$changeState(null, time);

                // run external handler
                this.$$stateHandler[_RxStateMachine.STATE.IDLE](this.$$stateDurationTime, symbolData);
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

                // run external handler
                this.$$stateHandler[_RxStateMachine.STATE.SYNC](this.$$stateDurationTime, symbolData);

                if (this.$$stateDurationTime > this.$$syncStateMaxDurationTime) {
                    this.$$changeState(_RxStateMachine.STATE.ERROR, time);
                    return false;
                }
            }

            return true;
        };

        RSM.prototype.$$handlerGuard = function (symbolData, time) {
            if (symbolData.symbol !== null) {
                this.$$changeState(_RxStateMachine.STATE.SYMBOL, time);
                return false;
            } else {
                this.$$changeState(null, time);

                // run external handler
                this.$$stateHandler[_RxStateMachine.STATE.GUARD](this.$$stateDurationTime, symbolData);
                
                if (this.$$stateDurationTime > this.$$guardStateMaxDurationTime) {
                    this.$$changeState(_RxStateMachine.STATE.IDLE, time);
                    return false;
                }
            }

            return true;
        };

        RSM.prototype.$$handlerError = function (symbolData, time) {
            if (symbolData.symbol === null) {
                this.$$changeState(_RxStateMachine.STATE.IDLE, time);
                return false;
            } else {
                this.$$changeState(null, time);

                // run external handler
                this.$$stateHandler[_RxStateMachine.STATE.ERROR](this.$$stateDurationTime, symbolData);
            }

            return true;
        };

        RSM.prototype.setGuardStateMaxDurationTime = function (time) {
            this.$$guardStateMaxDurationTime = time;
        };

        RSM.prototype.setSymbolStateMaxDurationTime = function (time) {
            this.$$symbolStateMaxDurationTime = time;
        };

        RSM.prototype.setSyncStateMaxDurationTime = function (time) {
            this.$$syncStateMaxDurationTime = time;
        };

        RSM.prototype.getState = function (symbolData, time) {
            var
                S = _RxStateMachine.STATE,
                finished
            ;

            if (
                this.$$guardStateMaxDurationTime === null ||
                this.$$symbolStateMaxDurationTime === null ||
                this.$$syncStateMaxDurationTime === null
            ) {
                throw 'Please set all max duration times first';
            }

            while (true) {
                switch (this.$$state) {
                    case S.IDLE:
                        finished = this.$$handlerIdle(symbolData, time);
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
                    case S.ERROR:
                        finished = this.$$handlerError(symbolData, time);
                        break;
                }

                if (finished) {
                    break;
                }
            }
            return this.$$state;
        };

        return RSM;
    }

    return _RxStateMachine();        // TODO change it to dependency injection

})();