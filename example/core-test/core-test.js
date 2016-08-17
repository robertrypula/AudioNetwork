var
    ReceiveCarrierRecovery = AudioNetwork.Injector.resolve('PhysicalLayerCore.ReceiveCarrierRecovery'),
    receiveCarrierRecovery;

function onLoad() {
    receiveCarrierRecovery = new ReceiveCarrierRecovery();
}
