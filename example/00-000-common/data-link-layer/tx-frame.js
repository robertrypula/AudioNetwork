// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var TxFrame = (function () {
    var TxFrame;

    TxFrame = function (txFrameId, txFramePayload, isTxFrameCommand) {
        Frame.call(this, txFrameId, txFramePayload, isTxFrameCommand);

        this.$$txSymbolId = [];
        this.$$txSymbolTransmitted = 0;
    };

    TxFrame.prototype = Object.create(Frame.prototype);
    TxFrame.prototype.constructor = TxFrame;

    TxFrame.TX_BYTE_INDEX_OUT_OF_RANGE_EXCEPTION = 'TX_BYTE_INDEX_OUT_OF_RANGE_EXCEPTION';

    TxFrame.prototype.cloneClean = function () {
        return {
            id: this.$$id,
            txFrameHeader: this.$$header,
            txFramePayload: this.$$payload.slice(0),
            txFrameChecksum: this.$$checksum,
            txSymbolId: this.$$txSymbolId.slice(0),
            txSymbolTransmitted: this.$$txSymbolTransmitted
        };
    };

    TxFrame.prototype.getTxByteLength = function () {
        return this.$$payload.length + 2;   // payload + header + checksum
    };

    TxFrame.prototype.addTxSymbolId = function (txSymbolId) {
        this.$$txSymbolId.push(txSymbolId);
    };

    TxFrame.prototype.tryToConfirmTxSymbolId = function (txSymbolId) {
        var isTxSymbolIdPartOfThisFrame = TxFrame.$$inArray(this.$$txSymbolId, txSymbolId);

        if (isTxSymbolIdPartOfThisFrame) {
            this.$$txSymbolTransmitted++;
            return true;
        }
        return false;
    };

    TxFrame.prototype.isFullyTransmitted = function () {
        return this.$$txSymbolId.length === this.$$txSymbolTransmitted;
    };

    TxFrame.prototype.getTxByte = function (index) {
        var txByteLength = this.getTxByteLength();

        if (index < 0 || index >= txByteLength) {
            throw TxFrame.TX_BYTE_INDEX_OUT_OF_RANGE_EXCEPTION;
        }

        if (index === 0) {
            return this.$$header;
        }

        if (index === txByteLength - 1) {
            return this.$$checksum;
        }

        return this.$$payload[index - 1];
    };

    TxFrame.$$inArray = function (array, value) {
        var i;

        for (i = 0; i < array.length; i++) {
            if (array[i] === value) {
                return true;
            }
        }

        return false;
    };

    return TxFrame;
})();
