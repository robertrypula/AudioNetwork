// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

if (AudioNetwork.bootConfig.createAlias) {

    AudioNetwork.Rewrite = {};
    AudioNetwork.Rewrite.Dsp = {};
    AudioNetwork.Rewrite.PhysicalLayer = {};
    AudioNetwork.Rewrite.DataLinkLayer = {};
    AudioNetwork.Rewrite.Util = {};
    AudioNetwork.Rewrite.WebAudio = {};
    AudioNetwork.Visualizer = {};

    AudioNetwork.Rewrite.Dsp.Complex = AudioNetwork.Injector.resolve('Rewrite.Dsp.Complex');
    AudioNetwork.Rewrite.Dsp.Correlator = AudioNetwork.Injector.resolve('Rewrite.Dsp.Correlator');
    AudioNetwork.Rewrite.Dsp.Fft = AudioNetwork.Injector.resolve('Rewrite.Dsp.Fft');
    AudioNetwork.Rewrite.Dsp.FFTResult = AudioNetwork.Injector.resolve('Rewrite.Dsp.FFTResult');       // TODO rename to FftResult
    AudioNetwork.Rewrite.Dsp.WaveAnalyser = AudioNetwork.Injector.resolve('Rewrite.Dsp.WaveAnalyser');
    AudioNetwork.Rewrite.Dsp.WaveGenerator = AudioNetwork.Injector.resolve('Rewrite.Dsp.WaveGenerator');
    AudioNetwork.Rewrite.PhysicalLayer.PhysicalLayerBuilder = AudioNetwork.Injector.resolve('Rewrite.PhysicalLayer.PhysicalLayerBuilder');
    AudioNetwork.Rewrite.DataLinkLayer.DataLinkLayerBuilder = AudioNetwork.Injector.resolve('Rewrite.DataLinkLayer.DataLinkLayerBuilder');
    AudioNetwork.Rewrite.Util.Buffer = AudioNetwork.Injector.resolve('Rewrite.Util.Buffer');
    AudioNetwork.Rewrite.Util.FrequencyCalculator = AudioNetwork.Injector.resolve('Rewrite.Util.FrequencyCalculator');
    AudioNetwork.Rewrite.Util.MusicCalculator = AudioNetwork.Injector.resolve('Rewrite.Util.MusicCalculator');
    AudioNetwork.Rewrite.Util.SmartTimer = AudioNetwork.Injector.resolve('Rewrite.Util.SmartTimer');
    AudioNetwork.Rewrite.Util.WavAudioFile = AudioNetwork.Injector.resolve('Rewrite.Util.WavAudioFile');
    AudioNetwork.Rewrite.WebAudio.AudioMonoIO = AudioNetwork.Injector.resolve('Rewrite.WebAudio.AudioMonoIO');
    AudioNetwork.Rewrite.WebAudio.AudioMonoIOLite = AudioNetwork.Injector.resolve('Rewrite.WebAudio.AudioMonoIOLite');
    AudioNetwork.Visualizer.AnalyserChart = AudioNetwork.Injector.resolve('Visualizer.AnalyserChart');
    AudioNetwork.Visualizer.ConstellationDiagram = AudioNetwork.Injector.resolve('Visualizer.ConstellationDiagram');
    AudioNetwork.Visualizer.PowerChart = AudioNetwork.Injector.resolve('Visualizer.PowerChart');
    AudioNetwork.Visualizer.SampleChart = AudioNetwork.Injector.resolve('Visualizer.SampleChart');
    AudioNetwork.Visualizer.FrequencyDomainChart = AudioNetwork.Injector.resolve('Visualizer.FrequencyDomainChart');
    AudioNetwork.Visualizer.ComplexPlaneChart = AudioNetwork.Injector.resolve('Visualizer.ComplexPlaneChart');

    // components listed below are mostly deprecated
    AudioNetwork.PhysicalLayer = {};
    AudioNetwork.PhysicalLayerAdapter = {};
    AudioNetwork.Audio = {};
    AudioNetwork.Common = {};

    AudioNetwork.PhysicalLayer.PhysicalLayer = AudioNetwork.Injector.resolve('PhysicalLayer.PhysicalLayer'); // deprecated
    AudioNetwork.PhysicalLayer.DefaultConfig = AudioNetwork.Injector.resolve('PhysicalLayer.DefaultConfig'); // deprecated
    AudioNetwork.PhysicalLayer.RxInput = AudioNetwork.Injector.resolve('PhysicalLayer.RxInput'); // deprecated
    AudioNetwork.PhysicalLayerAdapter.TransmitAdapter = AudioNetwork.Injector.resolve('PhysicalLayerAdapter.TransmitAdapter'); // deprecated
    AudioNetwork.PhysicalLayerAdapter.ReceiveAdapter = AudioNetwork.Injector.resolve('PhysicalLayerAdapter.ReceiveAdapter'); // deprecated
    AudioNetwork.Audio.ActiveAudioContext = AudioNetwork.Injector.resolve('Audio.ActiveAudioContext'); // deprecated
    AudioNetwork.Audio.SimpleAudioContext = AudioNetwork.Injector.resolve('Audio.SimpleAudioContext'); // deprecated
    AudioNetwork.Common.Queue = AudioNetwork.Injector.resolve('Common.Queue'); // deprecated
    AudioNetwork.Common.CarrierRecovery = AudioNetwork.Injector.resolve('Common.CarrierRecovery'); // deprecated
    AudioNetwork.Common.CarrierGenerate = AudioNetwork.Injector.resolve('Common.CarrierGenerate'); // deprecated
    AudioNetwork.Common.WindowFunction = AudioNetwork.Injector.resolve('Common.WindowFunction'); // probably deprecated
    AudioNetwork.Common.Util = AudioNetwork.Injector.resolve('Common.Util'); // deprecated
}

if (AudioNetwork.isNode) {
    module.exports = AudioNetwork;
}
