var physicalLayer, transmitAdapter, receiveAdapter;

function onLoad() {
    init();
}

function init() {
    var channel = [ { baseFrequency: 800 } ];

    physicalLayer = new AudioNetwork.PhysicalLayer.PhysicalLayer({
        tx: { channel: channel },
        rx: { channel: channel }
    });
    transmitAdapter = new AudioNetwork.PhysicalLayer.TransmitAdapter(physicalLayer);
    receiveAdapter = new AudioNetwork.PhysicalLayer.ReceiveAdapter(physicalLayer);

    physicalLayer.rx(function (channelIndex, carrierDetail, time) {
        var receiveData = receiveAdapter.receive(channelIndex, carrierDetail, time);
        document.getElementById('rx-status').innerHTML = receiveData.state;
    });

    receiveAdapter.setPacketReceiveHandler(function (channelIndex, data) {
        var rxPacket, str, i;

        rxPacket = document.getElementById('rx-packet');
        str = '';
        for (i = 0; i < data.length; i++) {
            str += (data[i]) + ' ';
        }
        rxPacket.value = str + '\n' + rxPacket.value;
    });
}

function sendPacket() {
    var dataList, symbol, i, data;

    data = [];
    dataList = (document.getElementById('tx-packet').value + '').split(' ');
    for (i = 0; i < dataList.length; i++) {
        symbol = parseInt(dataList[i]);
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
