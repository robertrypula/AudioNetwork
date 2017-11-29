var
    transportLayerMockA,
    transportLayerMockB;

function init() {
    transportLayerMockA = new TransportLayerMock('#socket-a-log', '#socket-a-state', '#socket-a-block-receive', '#socket-a-rx-data-chunk');
    transportLayerMockB = new TransportLayerMock('#socket-b-log', '#socket-b-state', '#socket-b-block-receive', '#socket-b-rx-data-chunk');

    transportLayerMockA.setOtherSideTransportLayer(transportLayerMockB);
    transportLayerMockB.setOtherSideTransportLayer(transportLayerMockA);
}

// ---------------------------------------------------------------------------------------------------------------------

var TransportLayerMock = function (logDomElementId, stateDomElementId, blockReceiveDomElementId, rxDataChunkDomElementId) {
    this.$$logDomElementId = logDomElementId;
    this.$$stateDomElementId = stateDomElementId;
    this.$$blockReceiveDomElementId = blockReceiveDomElementId;
    this.$$rxDataChunkDomElementId = rxDataChunkDomElementId;
    this.$$socket = new Socket(5, this);
    this.$$txSymbolId = 0;
    this.$$txFrameId = 0;
    this.$$txFrame = {
        id: null,
        txFramePayload: null,
        txSymbolId: null
    };
    this.$$otherSideTransportLayer = undefined;
    setInterval(this.txFrameProgress.bind(this), 1000);
};

TransportLayerMock.prototype.setOtherSideTransportLayer = function (otherSideTransportLayer) {
    this.$$otherSideTransportLayer = otherSideTransportLayer;
};

TransportLayerMock.prototype.onSocketStateChange = function (connectionState) {
    html(this.$$stateDomElementId, JSON.stringify(connectionState, null, 2));
};

TransportLayerMock.prototype.onRxDataChunk = function (rxDataChunk) {
    console.log(rxDataChunk);

    html(
        this.$$rxDataChunkDomElementId,
        getAsciiFromByteList(
            rxDataChunk[rxDataChunk.length - 1].getLastRxSegment().getPayload()
        ),
        true
    );
};

TransportLayerMock.prototype.rxFrame = function (rxFrame) {
    var rxSegment = Segment.fromRxFramePayload(rxFrame.rxFramePayload);

    this.$$socket.handleRxSegment(rxSegment);
};

TransportLayerMock.prototype.txFrameProgress = function () {
    var
        txSymbolId = this.$$txSymbolId++,
        txFrameId,
        txFramePayload,
        txSegment;

    // this emulates data link layer frame transmission
    if (
        this.$$txFrame.id !== null &&
        txSymbolId > (this.$$txFrame.txSymbolId + this.$$txFrame.txFramePayload.length)
    ) {
        this.txFrame(this.$$txFrame);
        this.$$txFrame.id = null;
        this.$$txFrame.txFramePayload = null;
        this.$$txFrame.txSymbolId = null;
    }

    txSegment = this.$$socket.getTxSegment(txSymbolId);

    if (this.$$txFrame.id === null && !txSegment) {
        html(this.$$logDomElementId, txSymbolId + '<br/>', true);
        return;
    }
    if (this.$$txFrame.id !== null && txSegment) {
        html(this.$$logDomElementId, txSymbolId + ': [frame-in-progress]' + '<br/>', true);
        return;
    }

    txFrameId = this.$$txFrameId++;
    txFramePayload = txSegment.getTxFramePayload();
    this.$$txFrame.id = txFrameId;
    this.$$txFrame.txFramePayload = txFramePayload;
    this.$$txFrame.txSymbolId = txSymbolId;
    txSegment.setTxFrameId(txFrameId);

    html(this.$$logDomElementId, txSymbolId + ': [frame-new] ' + getByteHexFromByteList(txFramePayload) + ' ' + txSegment.getHeaderLog() + '<br/>', true);
};

TransportLayerMock.prototype.txFrame = function (txFrame) {
    this.$$socket.txSegmentSent();

    this.$$otherSideTransportLayer.rxFrame({
        rxFramePayload: txFrame.txFramePayload.slice(0)
    });
};

TransportLayerMock.prototype.isReceiveBlocked = function () {    // TODO remove it, only for debugging
    return getCheckboxState(this.$$blockReceiveDomElementId);
};
