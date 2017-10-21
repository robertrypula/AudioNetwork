// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var TxSymbolManager = (function () { // <-- TODO this will be soon refactored when code will be moved to the main NPM package
    var TxSymbolManager;

    TxSymbolManager = function () {
        this.$$txSymbolId = 1;
        this.$$txSymbol = null;
        this.$$txSymbolCurrent = this.$$getTxSymbolIdle();
        this.$$txSymbolQueue = [];
    };

    TxSymbolManager.prototype.clearTxSymbolQueue = function () {
        this.$$txSymbolQueue.length = 0;
    };

    TxSymbolManager.prototype.getTxSymbol = function () {
        return this.$$txSymbol.cloneClean();
    };

    TxSymbolManager.prototype.getTxSymbolCurrent = function () {
        return this.$$txSymbolCurrent;
    };

    TxSymbolManager.prototype.getTxSymbolProgress = function () {
        var
            result = {},
            i;

        result.txSymbolCurrent = this.$$txSymbolCurrent.cloneClean();
        result.txSymbolQueue = [];
        result.isTxInProgress = this.isTxInProgress();

        for (i = 0; i < this.$$txSymbolQueue.length; i++) {
            result.txSymbolQueue.push(
                this.$$txSymbolQueue[i].cloneClean()
            );
        }

        return result;
    };

    TxSymbolManager.prototype.isTxInProgress = function () {
        return this.$$txSymbolQueue.length > 0 ||
            this.$$txSymbolCurrent.isNotIdle();
    };

    TxSymbolManager.prototype.addTxFskSymbol = function (txFskSymbol) {
        var txSymbol = new TxSymbol(
            this.$$txSymbolId++,
            TxSymbol.TX_SYMBOL_FSK
        );

        txSymbol.setTxFskSymbol(txFskSymbol);
        this.$$txSymbolQueue.push(txSymbol);

        return txSymbol.getId();
    };

    TxSymbolManager.prototype.addTxSymbolGapImportant = function () {
        var txSymbolGapImportant = new TxSymbol(
            this.$$txSymbolId++,
            TxSymbol.TX_SYMBOL_GAP_IMPORTANT
        );
        this.$$txSymbolQueue.push(txSymbolGapImportant);
    };

    TxSymbolManager.prototype.addTxSymbolGapDeletable = function () {
        var txSymbolGapDeletable = new TxSymbol(
            this.$$txSymbolId++,
            TxSymbol.TX_SYMBOL_GAP_DELETABLE
        );
        this.$$txSymbolQueue.push(txSymbolGapDeletable);
    };

    TxSymbolManager.prototype.$$getTxSymbolIdle = function () {
        return new TxSymbol(
            this.$$txSymbolId++,
            TxSymbol.TX_SYMBOL_IDLE
        );
    };

    TxSymbolManager.prototype.isTxAboutToStart = function () {
        var isQueueNotEmpty = this.$$txSymbolQueue.length !== 0;

        return this.$$txSymbolCurrent.isIdle() && isQueueNotEmpty;
    };

    TxSymbolManager.prototype.isTxAboutToEnd = function () {
        var isQueueEmpty = this.$$txSymbolQueue.length === 0;

        return isQueueEmpty && this.$$txSymbolCurrent.isNotIdle();
    };

    TxSymbolManager.prototype.tick = function () {
        var txSymbolIdle, isQueueEmpty;

        isQueueEmpty = this.$$txSymbolQueue.length === 0;
        this.$$txSymbol = this.$$txSymbolCurrent;

        if (isQueueEmpty) {
            txSymbolIdle = this.$$getTxSymbolIdle();
            this.$$txSymbolCurrent = txSymbolIdle;
        } else {
            this.$$txSymbolCurrent = this.$$txSymbolQueue.shift();
        }
    };

    TxSymbolManager.prototype.handleGapLogicAtStart = function () {
        // When device A sends some data to device B
        // then device B cannot respond immediately. We
        // need make sure that device A will have some time
        // to reinitialize microphone again. This is solved
        // by adding two 'gap' symbols in the beginning
        // Similar problem we have at the end. If we enable
        // microphone at the same time as last symbol stops
        // then we have a glitch. We need to add one 'gap'
        // symbol after the last symbol.
        // If symbol is not last we need to remove that
        // unnecessary gap.
        if (this.isTxInProgress()) {
            this.$$clearAllDeletableGapFromTheEndOfTheQueue();
        } else {
            this.addTxSymbolGapDeletable();  // #1
            this.addTxSymbolGapDeletable();  // #2
        }
    };

    TxSymbolManager.prototype.handleGapLogicAtEnd = function () {
        // will be removed if subsequent symbol will arrive
        this.addTxSymbolGapDeletable();
    };

    TxSymbolManager.prototype.handleGapLogicAtEndOfSync = function (gapImportantNumber) {
        var i;

        for (i = 0; i < gapImportantNumber; i++) {
            this.addTxSymbolGapImportant();
        }
    };

    TxSymbolManager.prototype.$$clearAllDeletableGapFromTheEndOfTheQueue = function () {
        var i;

        for (i = this.$$txSymbolQueue.length - 1; i >= 0; i--) {
            if (this.$$txSymbolQueue[i].isNotGapDeletable()) {
                this.$$txSymbolQueue.length = i + 1;
                break;
            }
        }
    };

    return TxSymbolManager;
})();
