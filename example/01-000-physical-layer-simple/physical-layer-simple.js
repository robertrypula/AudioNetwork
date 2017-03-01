// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl

var physicalLayer, transmitAdapter, receiveAdapter;

function onLoad() {
    var channel = [ { baseFrequency: 1070 } ];

    physicalLayer = new AudioNetwork.PhysicalLayer.PhysicalLayer({
        tx: { channel: channel },
        rx: { channel: channel }
    });
    transmitAdapter = new AudioNetwork.PhysicalLayerAdapter.TransmitAdapter(physicalLayer);
    receiveAdapter = new AudioNetwork.PhysicalLayerAdapter.ReceiveAdapter(physicalLayer);

    physicalLayer.rx(function (channelIndex, carrierDetail, time) {
        var receiveData = receiveAdapter.receive(channelIndex, carrierDetail, time);
        document.getElementById('rx-state').innerHTML = receiveData.state;
    });

    receiveAdapter.setPacketReceiveHandler(packetReceiveHandler);
}

function packetReceiveHandler(channelIndex, data) {
    var rxPacket;

    rxPacket = document.getElementById('rx-packet');
    rxPacket.value = data.join(' ') + '\n' + rxPacket.value;
}

function sendPacket() {
    var dataList, symbol, i, data;

    data = [];
    dataList = (document.getElementById('tx-packet').value + '').split(' ');
    for (i = 0; i < dataList.length; i++) {
        symbol = parseInt(dataList[i]) % 2;
        data.push(symbol);
    }

    transmitAdapter.packet(0, data);
}

function reset() {
    receiveAdapter.reset(0);
    document.getElementById('rx-packet').value = '';
}

function sync() {
    transmitAdapter.synchronization(0);
}
