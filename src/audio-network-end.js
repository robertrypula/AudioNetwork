// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

if (AudioNetwork.bootConfig.createAlias) {
    // create aliases for easier access

    AudioNetwork.PhysicalLayer = {};
    AudioNetwork.PhysicalLayer.PhysicalLayer = AudioNetwork.Injector.resolve('PhysicalLayer.PhysicalLayer');
    AudioNetwork.PhysicalLayer.DefaultConfig = AudioNetwork.Injector.resolve('PhysicalLayer.DefaultConfig');
    AudioNetwork.PhysicalLayer.RxInput = AudioNetwork.Injector.resolve('PhysicalLayer.RxInput');

    AudioNetwork.PhysicalLayerAdapter = {};
    AudioNetwork.PhysicalLayerAdapter.TransmitAdapter = AudioNetwork.Injector.resolve('PhysicalLayerAdapter.TransmitAdapter');
    AudioNetwork.PhysicalLayerAdapter.ReceiveAdapter = AudioNetwork.Injector.resolve('PhysicalLayerAdapter.ReceiveAdapter');

    AudioNetwork.Audio = {};
    AudioNetwork.Audio.ActiveAudioContext = AudioNetwork.Injector.resolve('Audio.ActiveAudioContext');
    AudioNetwork.Audio.SimpleAudioContext = AudioNetwork.Injector.resolve('Audio.SimpleAudioContext');

    AudioNetwork.Common = {};
    AudioNetwork.Common.Queue = AudioNetwork.Injector.resolve('Common.Queue');
    AudioNetwork.Common.CarrierRecovery = AudioNetwork.Injector.resolve('Common.CarrierRecovery');
    AudioNetwork.Common.CarrierGenerate = AudioNetwork.Injector.resolve('Common.CarrierGenerate');
    AudioNetwork.Common.WindowFunction = AudioNetwork.Injector.resolve('Common.WindowFunction');
    AudioNetwork.Common.Util = AudioNetwork.Injector.resolve('Common.Util');

    AudioNetwork.Visualizer = {};
    AudioNetwork.Visualizer.AnalyserChart = AudioNetwork.Injector.resolve('Visualizer.AnalyserChart');
    AudioNetwork.Visualizer.ConstellationDiagram = AudioNetwork.Injector.resolve('Visualizer.ConstellationDiagram');
    AudioNetwork.Visualizer.PowerChart = AudioNetwork.Injector.resolve('Visualizer.PowerChart');
    AudioNetwork.Visualizer.SampleChart = AudioNetwork.Injector.resolve('Visualizer.SampleChart');
    AudioNetwork.Visualizer.FrequencyDomainChart = AudioNetwork.Injector.resolve('Visualizer.FrequencyDomainChart');
    AudioNetwork.Visualizer.ComplexPlaneChart = AudioNetwork.Injector.resolve('Visualizer.ComplexPlaneChart');
}

if (AudioNetwork.isNode) {
    module.exports = AudioNetwork;
}
