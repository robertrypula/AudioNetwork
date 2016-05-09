'use strict';

// create aliases in main namespace for public classes
AudioNetwork.PhysicalLayer = AudioNetwork.Injector.resolve('PhysicalLayer.PhysicalLayer');
AudioNetwork.DefaultConfig = AudioNetwork.Injector.resolve('PhysicalLayer.DefaultConfig');
AudioNetwork.PhysicalLayerInput = AudioNetwork.Injector.resolve('PhysicalLayer.PhysicalLayerInput');
AudioNetwork.TransmitAdapter = AudioNetwork.Injector.resolve('PhysicalLayer.TransmitAdapter');
AudioNetwork.ReceiveAdapter = AudioNetwork.Injector.resolve('PhysicalLayer.ReceiveAdapter');
AudioNetwork.Queue = AudioNetwork.Injector.resolve('Common.Queue');
AudioNetwork.PowerChart = AudioNetwork.Injector.resolve('PhysicalLayer.PowerChart');

