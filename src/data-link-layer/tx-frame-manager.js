// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.DataLinkLayer.TxFrameManager', TxFrameManager);

    TxFrameManager.$inject = [];

    function TxFrameManager() {
        var TxFrameManager;

        TxFrameManager = function () {
            this.$$txFrameId = TxFrameManager.$$_INITIAL_TX_FRAME_ID;
            this.$$txFrame = null;
            this.$$txFrameCurrent = null;
            this.$$txFrameQueue = [];
        };

        TxFrameManager.$$_INITIAL_TX_FRAME_ID = 1;

        TxFrameManager.prototype.getNextTxFrameId = function () {
            return this.$$txFrameId++;
        };

        TxFrameManager.prototype.getTxFrameCloned = function () {
            return this.$$txFrame
                ? this.$$txFrame.cloneClean()
                : null;
        };

        TxFrameManager.prototype.getTxFrameProgressCloned = function () {
            var
                result = {},
                i;

            result.txFrame = this.getTxFrameCloned();

            result.txFrameCurrent = this.$$txFrameCurrent
                ? this.$$txFrameCurrent.cloneClean()
                : null;

            result.txFrameQueue = [];
            for (i = 0; i < this.$$txFrameQueue.length; i++) {
                result.txFrameQueue.push(
                    this.$$txFrameQueue[i].cloneClean()
                );
            }

            result.isTxFrameInProgress = this.isTxFrameInProgress();

            return result;
        };

        TxFrameManager.prototype.isTxFrameInProgress = function () {
            return this.$$txFrameQueue.length > 0 ||
                !!this.$$txFrameCurrent;
        };

        TxFrameManager.prototype.addTxFrame = function (txFrame) {
            this.$$txFrameQueue.push(txFrame);
        };

        TxFrameManager.prototype.handleTxSymbolId = function (txSymbolId) {
            var isQueueNotEmpty, confirmed;

            isQueueNotEmpty = this.$$txFrameQueue.length > 0;

            if (this.$$txFrameCurrent) {
                confirmed = this.$$txFrameCurrent.tryToConfirmTxSymbolId(txSymbolId);
                if (this.$$txFrameCurrent.isFullyTransmitted()) {
                    this.$$txFrame = this.$$txFrameCurrent;
                    this.$$txFrameCurrent = isQueueNotEmpty ? this.$$txFrameQueue.shift() : null;
                }
            } else {
                this.$$txFrame = null;
                this.$$txFrameCurrent = isQueueNotEmpty ? this.$$txFrameQueue.shift() : null;
            }

            if (this.$$txFrameCurrent && !confirmed) {
                this.$$txFrameCurrent.tryToConfirmTxSymbolId(txSymbolId);
            }
        };

        return TxFrameManager;
    }

})();
