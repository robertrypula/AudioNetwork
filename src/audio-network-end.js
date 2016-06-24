// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

// create aliases in main namespace for public classes
AudioNetwork.PhysicalLayer = {};
AudioNetwork.PhysicalLayer.PhysicalLayer = AudioNetwork.Injector.resolve('PhysicalLayer.PhysicalLayer');
AudioNetwork.PhysicalLayer.DefaultConfig = AudioNetwork.Injector.resolve('PhysicalLayer.DefaultConfig');
AudioNetwork.PhysicalLayer.RxInput = AudioNetwork.Injector.resolve('PhysicalLayer.RxInput');
AudioNetwork.PhysicalLayer.TransmitAdapter = AudioNetwork.Injector.resolve('PhysicalLayer.TransmitAdapter');
AudioNetwork.PhysicalLayer.ReceiveAdapter = AudioNetwork.Injector.resolve('PhysicalLayer.ReceiveAdapter');
AudioNetwork.PhysicalLayer.Audio = AudioNetwork.Injector.resolve('PhysicalLayer.Audio');

AudioNetwork.Common = {};
AudioNetwork.Common.Queue = AudioNetwork.Injector.resolve('Common.Queue');
AudioNetwork.Common.CarrierRecovery = AudioNetwork.Injector.resolve('Common.CarrierRecovery');
AudioNetwork.Common.CarrierGenerate = AudioNetwork.Injector.resolve('Common.CarrierGenerate');

AudioNetwork.Visualizer = {};
AudioNetwork.Visualizer.PowerChart = AudioNetwork.Injector.resolve('Visualizer.PowerChart');
