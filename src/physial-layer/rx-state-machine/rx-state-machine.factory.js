var RxStateMachine = (function () {
    'use strict';

    _RxStateMachine.$inject = [];

    function _RxStateMachine() {
        var RSM;

        RSM = function (handlerIdleInit, handlerSignalInit, handlerIdle, handlerSymbol, handlerSync, handlerGuard, handlerError) {
            this.$$stateHandler = {};
            this.$$stateHandler[RSM.STATE.IDLE_INIT] = handlerIdleInit;
            this.$$stateHandler[RSM.STATE.SIGNAL_INIT] = handlerSignalInit;
            this.$$stateHandler[RSM.STATE.IDLE] = handlerIdle;
            this.$$stateHandler[RSM.STATE.SYMBOL] = handlerSymbol;
            this.$$stateHandler[RSM.STATE.SYNC] = handlerSync;
            this.$$stateHandler[RSM.STATE.GUARD] = handlerGuard;
            this.$$stateHandler[RSM.STATE.ERROR] = handlerError;
            this.$$state = RSM.STATE.IDLE_INIT;
            this.$$stateDurationTime = 0;
            this.$$stateBeginTime = null;
            this.$$symbolStateMaxDurationTime = null;
            this.$$guardStateMaxDurationTime = null;
            this.$$syncStateMaxDurationTime = null;
        };

        RSM.STATE = {
            IDLE_INIT: 'IDLE_INIT',
            SIGNAL_INIT: 'SIGNAL_INIT',
            IDLE: 'IDLE',
            SYMBOL: 'SYMBOL',
            SYNC: 'SYNC',
            GUARD: 'GUARD',
            ERROR: 'ERROR'
        };

        RSM.prototype.$$changeState = function (newState, time) {
            if (newState !== null) {
                this.$$state = newState;
                this.$$stateBeginTime = time;
            } else {
                this.$$stateDurationTime = time - this.$$stateBeginTime;
            }
        };

        RSM.prototype.$$handlerIdleInit = function (pilotSignalPresent, time) {
            var newState;

            this.$$changeState(null, time);

            // run external handler
            newState = this.$$stateHandler[RSM.STATE.IDLE_INIT](this.$$stateDurationTime);

            if (newState) {
                this.$$changeState(newState, time);
                return false;
            }

            return true;
        };

        RSM.prototype.$$handlerSignalInit = function (pilotSignalPresent, time) {
            var newState;

            this.$$changeState(null, time);

            // run external handler
            newState = this.$$stateHandler[RSM.STATE.SIGNAL_INIT](this.$$stateDurationTime);

            if (newState) {
                this.$$changeState(newState, time);
                return false;
            }

            return true;
        };

        RSM.prototype.$$handlerIdle = function (pilotSignalPresent, time) {
            if (pilotSignalPresent) {
                this.$$changeState(RSM.STATE.SYMBOL, time);
                return false;
            } else {
                this.$$changeState(null, time);

                // run external handler
                this.$$stateHandler[RSM.STATE.IDLE](this.$$stateDurationTime);
            }

            return true;
        };

        RSM.prototype.$$handlerSymbol = function (pilotSignalPresent, time) {
            if (!pilotSignalPresent) {
                this.$$changeState(RSM.STATE.GUARD, time);
                return false;
            } else {
                this.$$changeState(null, time);

                // run external handler
                this.$$stateHandler[RSM.STATE.SYMBOL](this.$$stateDurationTime);

                if (this.$$stateDurationTime > this.$$symbolStateMaxDurationTime) {
                    this.$$changeState(RSM.STATE.SYNC, time);
                    return false;
                }
            }

            return true;
        };

        RSM.prototype.$$handlerSync = function (pilotSignalPresent, time) {
            if (!pilotSignalPresent) {
                this.$$changeState(RSM.STATE.IDLE, time);
                return false;
            } else {
                this.$$changeState(null, time);

                // run external handler
                this.$$stateHandler[RSM.STATE.SYNC](this.$$stateDurationTime);

                if (this.$$stateDurationTime > this.$$syncStateMaxDurationTime) {
                    this.$$changeState(RSM.STATE.ERROR, time);
                    return false;
                }
            }

            return true;
        };

        RSM.prototype.$$handlerGuard = function (pilotSignalPresent, time) {
            if (pilotSignalPresent) {
                this.$$changeState(RSM.STATE.SYMBOL, time);
                return false;
            } else {
                this.$$changeState(null, time);

                // run external handler
                this.$$stateHandler[RSM.STATE.GUARD](this.$$stateDurationTime);
                
                if (this.$$stateDurationTime > this.$$guardStateMaxDurationTime) {
                    this.$$changeState(RSM.STATE.IDLE, time);
                    return false;
                }
            }

            return true;
        };

        RSM.prototype.$$handlerError = function (pilotSignalPresent, time) {
            if (!pilotSignalPresent) {
                this.$$changeState(RSM.STATE.IDLE, time);
                return false;
            } else {
                this.$$changeState(null, time);

                // run external handler
                this.$$stateHandler[RSM.STATE.ERROR](this.$$stateDurationTime);
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

        RSM.prototype.getState = function (pilotSignalPresent, time) {
            var
                S = RSM.STATE,
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
                    case S.IDLE_INIT:
                        finished = this.$$handlerIdleInit(pilotSignalPresent, time);
                        break;
                    case S.SIGNAL_INIT:
                        finished = this.$$handlerSignalInit(pilotSignalPresent, time);
                        break;
                    case S.IDLE:
                        finished = this.$$handlerIdle(pilotSignalPresent, time);
                        break;
                    case S.SYMBOL:
                        finished = this.$$handlerSymbol(pilotSignalPresent, time);
                        break;
                    case S.SYNC:
                        finished = this.$$handlerSync(pilotSignalPresent, time);
                        break;
                    case S.GUARD:
                        finished = this.$$handlerGuard(pilotSignalPresent, time);
                        break;
                    case S.ERROR:
                        finished = this.$$handlerError(pilotSignalPresent, time);
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
