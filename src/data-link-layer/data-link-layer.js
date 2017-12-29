// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var PhysicalLayerBuilder = AudioNetwork.Rewrite.PhysicalLayer.PhysicalLayerBuilder;

// TODO move and refactor RX code (dedicated classes like in TX part)
// TODO implement solution what will not require PhysicalLayer synchronization (looking for frames in two FSK symbol streams)

var DataLinkLayer = (function () { // <-- TODO this will be soon refactored when code will be moved to the main NPM package
    var DataLinkLayer;

    DataLinkLayer = function (builder) {
        // let's create network stack!
        // Data Link Layer hides Physical Layer inside
        this.$$physicalLayer = (new PhysicalLayerBuilder())
            .rxSymbolListener(this.$$rxSymbolListener.bind(this))
            .rxSampleDspDetailsListener(builder._rxSampleDspDetailsListener)
            .rxSyncStatusListener(builder._rxSyncStatusListener)
            .rxSyncDspDetailsListener(builder._rxSyncDspDetailsListener)
            .rxDspConfigListener(builder._rxDspConfigListener)
            .dspConfigListener(builder._dspConfigListener)
            .txSymbolListener(this.$$txSymbolListener.bind(this))
            .txSymbolProgressListener(builder._txSymbolProgressListener)
            .txDspConfigListener(builder._txDspConfigListener)
            .build();

        // general config
        this.$$framePayloadLengthLimit = builder._framePayloadLengthLimit;

        // state variables
        this.$$frame = undefined;
        this.$$frameId = DataLinkLayer.$$_INITIAL_ID;
        this.$$frameCandidateId = DataLinkLayer.$$_INITIAL_ID;
        this.$$frameCandidateList = [];
        this.$$txFrameManager = new TxFrameManager();

        // setup listeners - data link layer
        this.$$rxFrameListener = DataLinkLayer.$$isFunction(builder._rxFrameListener) ? builder._rxFrameListener : null;
        this.$$rxFrameCandidateListener = DataLinkLayer.$$isFunction(builder._rxFrameCandidateListener) ? builder._rxFrameCandidateListener : null;
        this.$$txFrameListener = DataLinkLayer.$$isFunction(builder._txFrameListener) ? builder._txFrameListener : null;
        this.$$txFrameProgressListener = DataLinkLayer.$$isFunction(builder._txFrameProgressListener) ? builder._txFrameProgressListener : null;

        // setup listeners - physical layer
        this.$$externalRxSymbolListener = DataLinkLayer.$$isFunction(builder._rxSymbolListener) ? builder._rxSymbolListener : null;
        this.$$externalTxSymbolListener = DataLinkLayer.$$isFunction(builder._txSymbolListener) ? builder._txSymbolListener : null;
    };

    DataLinkLayer.PAYLOAD_TO_BIG_EXCEPTION = 'Payload is too big!';

    DataLinkLayer.COMMAND_TWO_WAY_SYNC_44100 = 0;
    DataLinkLayer.COMMAND_TWO_WAY_SYNC_48000 = 1;

    DataLinkLayer.$$_HEADER_FRAME_START_MARKER = 0xE0;
    DataLinkLayer.$$_HEADER_RESERVED_BIT = 0x08;
    DataLinkLayer.$$_HEADER_COMMAND_BIT_SET = 0x10;
    DataLinkLayer.$$_HEADER_COMMAND_BIT_NOT_SET = 0x00;
    DataLinkLayer.$$_HEADER_PAYLOAD_LENGTH_MASK = 0x0F;
    DataLinkLayer.$$_ONE_BYTE_MASK = 0xFF;

    DataLinkLayer.$$_PAYLOAD_TYPE_COMMAND = 'PAYLOAD_TYPE_COMMAND';
    DataLinkLayer.$$_PAYLOAD_TYPE_DATA = 'PAYLOAD_TYPE_DATA';

    DataLinkLayer.$$_INITIAL_ID = 1;
    DataLinkLayer.$$_HEADER_AND_CHECKSUM_BYTE_OVERHEAD = 2;

    DataLinkLayer.prototype.getPhysicalLayer = function () {
        return this.$$physicalLayer;
    };

    DataLinkLayer.prototype.getRxSampleRate = function () {
        var rxDspConfig = this.$$physicalLayer.getRxDspConfig();

        return rxDspConfig.rxSampleRate;
    };

    DataLinkLayer.prototype.setTxSampleRate = function (txSampleRate) {
        this.$$physicalLayer.setTxSampleRate(txSampleRate);  // alias for easier access
    };

    DataLinkLayer.prototype.txSync = function () {
        this.$$physicalLayer.txSync();  // alias for easier access
    };

    DataLinkLayer.prototype.txTwoWaySync = function () {
        var isCommand = true;

        this.txSync();
        switch (this.getRxSampleRate()) {
            case 44100:
                this.txFrame([DataLinkLayer.COMMAND_TWO_WAY_SYNC_44100], isCommand);
                break;
            case 48000:
                this.txFrame([DataLinkLayer.COMMAND_TWO_WAY_SYNC_48000], isCommand);
                break;
        }
    };

    DataLinkLayer.prototype.setLoopback = function (state) {
        this.$$physicalLayer.setLoopback(state);  // alias for easier access
    };

    DataLinkLayer.prototype.getFramePayloadLengthLimit = function () {
        return this.$$framePayloadLengthLimit;
    };

    DataLinkLayer.prototype.txFrame = function (txFramePayload, isTxFrameCommand) {
        var txFrame, txDspConfig, txSymbolMin, i, txByte, txSymbol, txSymbolId;

        if (txFramePayload.length > this.$$framePayloadLengthLimit) {
            throw DataLinkLayer.PAYLOAD_TO_BIG_EXCEPTION;
        }

        txFrame = new TxFrame(
            this.$$txFrameManager.getNextTxFrameId(),
            txFramePayload,
            isTxFrameCommand
        );

        txDspConfig = this.$$physicalLayer.getTxDspConfig();
        txSymbolMin = txDspConfig.txSymbolMin;
        for (i = 0; i < txFrame.getTxByteLength(); i++) {
            txByte = txFrame.getTxByte(i);
            txSymbol = txSymbolMin + txByte;
            txSymbolId = this.$$physicalLayer.txSymbol(txSymbol);
            txFrame.addTxSymbolId(txSymbolId);
        }

        this.$$txFrameManager.addTxFrame(txFrame);

        this.$$txFrameProgressListener ? this.$$txFrameProgressListener(this.getTxFrameProgress()) : undefined;

        return txFrame.getId();
    };

    DataLinkLayer.prototype.getTxFrame = function () {
        return this.$$txFrameManager.getTxFrameCloned();
    };

    DataLinkLayer.prototype.getTxFrameProgress = function () {
        return this.$$txFrameManager.getTxFrameProgressCloned();
    };

    DataLinkLayer.prototype.getRxFrame = function () {
        var
            frame = this.$$frame,
            frameCopy;

        if (!frame) {
            return null;
        }

        frameCopy = {
            id: frame.id,
            header: frame.rxFrameHeader,
            pyload: frame.rxFramePayload.slice(0),
            checksum: frame.rxFrameChecksum,
            isCommand: frame.isRxFrameCommand,
            rxFrameCandidateId: frame.rxFrameCandidateId
        };

        return frameCopy;
    };

    DataLinkLayer.prototype.getRxFrameCandidate = function () {
        var i, frameCandidate, frameCandidateCopy, result = [];

        for (i = 0; i < this.$$frameCandidateList.length; i++) {
            frameCandidate = this.$$frameCandidateList[i];
            frameCandidateCopy = {
                id: frameCandidate.id,
                byteReceived: frameCandidate.rxByteReceived.slice(0),
                byteExpected: frameCandidate.rxByteExpected,
                unitProgress: frameCandidate.rxByteReceived.length / frameCandidate.rxByteExpected,
                isFullyReceived: frameCandidate.rxByteReceived.length === frameCandidate.rxByteExpected,
                isValid: frameCandidate.isRxFrameCandidateValid,
                rxSampleDspDetailsId: frameCandidate.rxSampleDspDetailsId.slice(0)
            };
            result.push(frameCandidateCopy);
        }

        return result;
    };

// -----------------------------------------------------

    DataLinkLayer.prototype.$$handleRxSymbol = function (data) {
        var
            rxSampleDspDetails = this.$$physicalLayer.getRxSampleDspDetails(),
            rxDspConfig = this.$$physicalLayer.getRxDspConfig(),
            rxSymbolMin = rxDspConfig.rxSymbolMin,
            byte = (rxSampleDspDetails.rxSymbolRaw - rxSymbolMin) & DataLinkLayer.$$_ONE_BYTE_MASK,
            rxSampleDspDetailsId = rxSampleDspDetails.id,
            isNewFrameAvailable,
            command;

        this.$$cleanUpFrameCandidateList();
        this.$$addNewByteToFrameCandidateList(byte, rxSampleDspDetailsId);
        this.$$tryToCreateNewFrameCandidate(byte, rxSampleDspDetailsId);
        isNewFrameAvailable = this.$$tryToFindNewFrame();

        // call listeners
        this.$$rxFrameCandidateListener ? this.$$rxFrameCandidateListener(this.getRxFrameCandidate()) : undefined;
        if (isNewFrameAvailable) {
            if (this.$$frame.isRxFrameCommand) {
                command = this.$$frame.rxFramePayload[0];
                this.$$handleReceivedCommand(command);
            }
            this.$$rxFrameListener ? this.$$rxFrameListener(this.getRxFrame()) : undefined;
        }
    };

    DataLinkLayer.prototype.$$handleTxSymbol = function (data) {
        var txSymbolId, txFrameCloned;

        txSymbolId = data.id;
        this.$$txFrameManager.handleTxSymbolId(txSymbolId);

        txFrameCloned = this.$$txFrameManager.getTxFrameCloned();
        if (txFrameCloned) {
            this.$$txFrameListener ? this.$$txFrameListener(txFrameCloned) : undefined;
        }
        this.$$txFrameProgressListener ? this.$$txFrameProgressListener(this.getTxFrameProgress()) : undefined;
    };

    DataLinkLayer.prototype.$$cleanUpFrameCandidateList = function () {
        var i, frameCandidate, receivedFully;

        for (i = this.$$frameCandidateList.length - 1; i >= 0; i--) {
            frameCandidate = this.$$frameCandidateList[i];
            receivedFully = frameCandidate.rxByteReceived.length === frameCandidate.rxByteExpected;
            if (receivedFully) {
                this.$$frameCandidateList.splice(i, 1);
            }
        }
    };

    DataLinkLayer.prototype.$$addNewByteToFrameCandidateList = function (byte, rxSampleDspDetailsId) {
        var i, frameCandidate, readyToComputeChecksum, fullyReceived, notFullyReceived, frameWithoutChecksum, rxChecksum;

        for (i = 0; i < this.$$frameCandidateList.length; i++) {
            frameCandidate = this.$$frameCandidateList[i];
            notFullyReceived = frameCandidate.rxByteReceived.length < frameCandidate.rxByteExpected;
            if (notFullyReceived) {
                frameCandidate.rxByteReceived.push(byte);
                frameCandidate.rxSampleDspDetailsId.push(rxSampleDspDetailsId);
            }

            readyToComputeChecksum = frameCandidate.rxByteReceived.length === (frameCandidate.rxByteExpected - 1);
            if (readyToComputeChecksum) {
                frameWithoutChecksum = frameCandidate.rxByteReceived;
                frameCandidate.rxChecksumExpected = ChecksumService.fletcher8(frameWithoutChecksum);
            }

            fullyReceived = frameCandidate.rxByteReceived.length === frameCandidate.rxByteExpected;
            if (fullyReceived) {
                rxChecksum = frameCandidate.rxByteReceived[frameCandidate.rxByteReceived.length - 1];
                frameCandidate.isRxFrameCandidateValid = frameCandidate.rxChecksumExpected === rxChecksum;
            }
        }
    };

    DataLinkLayer.prototype.$$tryToCreateNewFrameCandidate = function (byte, rxSampleDspDetailsId) {
        var frameCandidate, header, payloadLength;

        if (!DataLinkLayer.$$isValidHeader(byte)) {
            return;
        }
        header = byte;
        payloadLength = DataLinkLayer.$$getPayloadLength(header);

        frameCandidate = {
            id: this.$$frameCandidateId++,
            rxByteReceived: [header],
            rxByteExpected: payloadLength + DataLinkLayer.$$_HEADER_AND_CHECKSUM_BYTE_OVERHEAD,
            isRxFrameCandidateValid: false,
            rxChecksumExpected: null,
            rxSampleDspDetailsId: [rxSampleDspDetailsId]
        };
        this.$$frameCandidateList.push(frameCandidate);
    };

    DataLinkLayer.prototype.$$tryToFindNewFrame = function () {
        var i, frameCandidate;

        for (i = 0; i < this.$$frameCandidateList.length; i++) {
            frameCandidate = this.$$frameCandidateList[i];
            if (frameCandidate.isRxFrameCandidateValid) {
                this.$$frame = DataLinkLayer.$$getRxFrameFromFrameCandidate(frameCandidate, this.$$frameId++);
                // there is possibility that there are more valid frames
                // but the assumption is that we are picking the biggest one only
                return true;
            }
        }

        return false;
    };

    DataLinkLayer.prototype.$$handleReceivedCommand = function (command) {
        switch (command) {
            case DataLinkLayer.COMMAND_TWO_WAY_SYNC_44100:
                this.setTxSampleRate(44100);
                this.txSync();
                break;
            case DataLinkLayer.COMMAND_TWO_WAY_SYNC_48000:
                this.setTxSampleRate(48000);
                this.txSync();
                break;
        }
    };

// -----------------------------------------------------

    DataLinkLayer.prototype.$$txSymbolListener = function (data) {
        this.$$externalTxSymbolListener ? this.$$externalTxSymbolListener(data) : undefined;
        this.$$handleTxSymbol(data);
    };

    DataLinkLayer.prototype.$$rxSymbolListener = function (data) {
        this.$$externalRxSymbolListener ? this.$$externalRxSymbolListener(data) : undefined;
        this.$$handleRxSymbol(data);
    };

// -----------------------------------------------------

    DataLinkLayer.$$getRxFrameFromFrameCandidate = function (frameCandidate, frameId) {
        var frame, rxFrameHeader;

        rxFrameHeader = frameCandidate.rxByteReceived[0];
        frame = {
            id: frameId,
            rxFrameHeader: rxFrameHeader,
            rxFramePayload: frameCandidate.rxByteReceived.slice(1, frameCandidate.rxByteReceived.length - 1),
            rxFrameChecksum: frameCandidate.rxByteReceived[frameCandidate.rxByteReceived.length - 1],
            isRxFrameCommand: DataLinkLayer.$$getIsCommand(rxFrameHeader),
            rxFrameCandidateId: frameCandidate.id
        };

        return frame;
    };

    DataLinkLayer.$$buildFrame = function (payloadType, payload) { // TODO refactor needed as we have dedicated Frame class
        var frame, isCommand, header, checksum, i, byte;

        frame = [];
        isCommand = payloadType === DataLinkLayer.$$_PAYLOAD_TYPE_COMMAND;
        header = DataLinkLayer.$$getHeader(isCommand, payload.length);
        frame.push(header);
        for (i = 0; i < payload.length; i++) {
            byte = payload[i] & DataLinkLayer.$$_ONE_BYTE_MASK;
            frame.push(byte);
        }
        checksum = ChecksumService.fletcher8(frame);
        frame.push(checksum);

        return frame;
    };

    DataLinkLayer.$$getHeader = function (isCommand, payloadLength) { // TODO refactor needed as we have dedicated Frame class
        var header, frameStartMarker, commandBit;

        frameStartMarker = DataLinkLayer.$$_HEADER_FRAME_START_MARKER;
        commandBit = isCommand
            ? DataLinkLayer.$$_HEADER_COMMAND_BIT_SET
            : DataLinkLayer.$$_HEADER_COMMAND_BIT_NOT_SET;
        payloadLength = DataLinkLayer.$$_HEADER_PAYLOAD_LENGTH_MASK & payloadLength;

        header = frameStartMarker | commandBit | payloadLength;

        return header;
    };

    DataLinkLayer.$$isValidHeader = function (byte) { // TODO refactor needed as we have dedicated Frame class
        var frameStartMarkerAvailable, reservedBitNotSet;

        frameStartMarkerAvailable = (DataLinkLayer.$$_HEADER_FRAME_START_MARKER & byte) === DataLinkLayer.$$_HEADER_FRAME_START_MARKER;
        reservedBitNotSet = !(DataLinkLayer.$$_HEADER_RESERVED_BIT & byte);

        return frameStartMarkerAvailable && reservedBitNotSet;
    };

    DataLinkLayer.$$getPayloadLength = function (header) { // TODO refactor needed as we have dedicated Frame class
        return header & DataLinkLayer.$$_HEADER_PAYLOAD_LENGTH_MASK;
    };

    DataLinkLayer.$$getIsCommand = function (header) { // TODO refactor needed as we have dedicated Frame class
        return !!(header & DataLinkLayer.$$_HEADER_COMMAND_BIT_SET);
    };

    DataLinkLayer.$$isFunction = function (variable) {
        return typeof variable === 'function';
    };

    return DataLinkLayer;
})();
