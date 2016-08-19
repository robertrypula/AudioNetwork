var
    ReceiveMulticoreWorker = AudioNetwork.Injector.resolve('PhysicalLayerCore.ReceiveMulticoreWorker'),
    receiveMulticoreWorker;

function onClick() {
    receiveMulticoreWorker = new ReceiveMulticoreWorker();
}

setTimeout(function () {
    document.write('TEST');
    setTimeout(onClick, 0);
}, 2000);
