// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var TxSymbol = (function () { // <-- TODO this will be soon refactored when code will be moved to the main NPM package
    var TxSymbol;

    TxSymbol = function (id, type) {
        this.$$id = id;
        this.$$txSymbolType = type;
        this.$$txFskSymbol = null;
    };

    TxSymbol.TX_SYMBOL_IDLE = 'TX_SYMBOL_IDLE';
    TxSymbol.TX_SYMBOL_GAP_IMPORTANT = 'TX_SYMBOL_GAP_IMPORTANT';
    TxSymbol.TX_SYMBOL_GAP_DELETABLE = 'TX_SYMBOL_GAP_DELETABLE';
    TxSymbol.TX_SYMBOL_FSK = 'TX_SYMBOL_FSK';

    TxSymbol.prototype.setTxFskSymbol = function (txFskSymbol) {
        this.$$txFskSymbol = txFskSymbol;
    };

    TxSymbol.prototype.cloneClean = function () {
        return {
            id: this.$$id,
            txSymbolType: this.$$txSymbolType,
            txFskSymbol: this.$$txFskSymbol
        };
    };

    TxSymbol.prototype.isNotIdle = function () {
        return this.$$txSymbolType !== TxSymbol.TX_SYMBOL_IDLE;
    };

    TxSymbol.prototype.isIdle = function () {
        return this.$$txSymbolType === TxSymbol.TX_SYMBOL_IDLE;
    };

    TxSymbol.prototype.isFsk = function () {
        return this.$$txSymbolType === TxSymbol.TX_SYMBOL_FSK;
    };

    TxSymbol.prototype.isNotGapDeletable = function () {
        return this.$$txSymbolType !== TxSymbol.TX_SYMBOL_GAP_DELETABLE;
    };

    TxSymbol.prototype.getId = function () {
        return this.$$id;
    };

    TxSymbol.prototype.getTxFskSymbol = function () {
        return this.$$txFskSymbol;
    };

    return TxSymbol;
})();
