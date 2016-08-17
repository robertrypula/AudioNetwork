var
    ReceiveMulticoreWorker = AudioNetwork.Injector.resolve('PhysicalLayerCore.ReceiveMulticoreWorker'),
    receiveMulticoreWorker;

function onClick() {
    receiveMulticoreWorker = new ReceiveMulticoreWorker();
}

setTimeout(onClick, 2000);
