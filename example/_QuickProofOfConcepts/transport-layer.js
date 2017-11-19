var
    transportLayerMockA,
    transportLayerMockB;

function init() {
    transportLayerMockA = new TransportLayerMock('#socket-a-log', '#socket-a-state');
    transportLayerMockB = new TransportLayerMock('#socket-b-log', '#socket-b-state');

    transportLayerMockA.setOtherSideTransportLayer(transportLayerMockB);
    transportLayerMockB.setOtherSideTransportLayer(transportLayerMockA);
}

// ---------------------------------------------------------------------------------------------------------------------

var TransportLayerMock = function (logDomElementId, stateDomElementId) {
    this.$$logDomElementId = logDomElementId;
    this.$$stateDomElementId = stateDomElementId;
    this.$$socket = new Socket(5, this);
    this.$$txSymbolId = 0;
    this.$$txFrameId = 0;
    this.$$txFrame = {
        id: null,
        txFramePayload: null,
        txSymbolId: null
    };
    this.$$otherSideTransportLayer = undefined;
    setInterval(this.txFrameProgress.bind(this), 500);
};

TransportLayerMock.prototype.setOtherSideTransportLayer = function (otherSideTransportLayer) {
    this.$$otherSideTransportLayer = otherSideTransportLayer;
};

TransportLayerMock.prototype.onSocketStateChange = function (state) {
    html(this.$$stateDomElementId, state);
};

TransportLayerMock.prototype.txFrame = function (txFrame) {
    var txSegment = this.$$socket.findTxSegmentByTxFrameId(txFrame.id);

    if (txSegment) {
        txSegment.markTxFrameAsFinished();
    }
    this.$$otherSideTransportLayer.rxFrame({
        rxFramePayload: txFrame.txFramePayload.slice(0)
    });
};

TransportLayerMock.prototype.txFrameProgress = function () {
    var
        txSymbolId = this.$$txSymbolId++,
        txFrameId,
        txFramePayload,
        txSegment;

    if (this.$$txFrame.id !== null) {
        if (txSymbolId > (this.$$txFrame.txSymbolId + this.$$txFrame.txFramePayload.length)) {
            this.txFrame(this.$$txFrame);
            this.$$txFrame.id = null;
            this.$$txFrame.txFramePayload = null;
            this.$$txFrame.txSymbolId = null;
            html(this.$$logDomElementId, txSymbolId + ': [frame-tx-finished]<br/>', true);
        } else {
            html(this.$$logDomElementId, txSymbolId + ': [frame-tx-in-progress]<br/>', true);
        }
        return;
    }

    txSegment = this.$$socket.getTxSegment(txSymbolId);
    if (!txSegment) {
        html(this.$$logDomElementId, txSymbolId + '<br/>', true);
        return;
    }

    txFrameId = this.$$txFrameId++;
    txFramePayload = txSegment.getTxFramePayload();
    this.$$txFrame.id = txFrameId;
    this.$$txFrame.txFramePayload = txFramePayload;
    this.$$txFrame.txSymbolId = txSymbolId;
    txSegment.setTxFrameId(txFrameId);

    html(this.$$logDomElementId, txSymbolId + ': [new-frame] ' + getByteHexFromByteList(txFramePayload) + '<br/>', true);
};

TransportLayerMock.prototype.rxFrame = function (rxFrame) {
    var rxSegment = Segment.fromRxFramePayload(rxFrame.rxFramePayload);

    this.$$socket.handleRxSegment(rxSegment);
};
