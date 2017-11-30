// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    FrequencyDomainChart = AudioNetwork.Visualizer.FrequencyDomainChart,
    ConstellationDiagram = AudioNetwork.Visualizer.ConstellationDiagram,
    ComplexPlaneChart = AudioNetwork.Visualizer.ComplexPlaneChart,
    SampleChart = AudioNetwork.Visualizer.SampleChart,
    CarrierGenerate = AudioNetwork.Common.CarrierGenerate,
    WindowFunction = AudioNetwork.Common.WindowFunction,
    Queue = AudioNetwork.Common.Queue;

var
    // general settings
    SAMPLE_RATE = 44100,
    SAMPLE_CHART_COMPACT_HEIGHT = 50,
    SAMPLE_CHART_COMPACT_RADIUS = 1,
    SAMPLE_CHART_COMPACT_BAR_WIDTH = 1,
    SAMPLE_CHART_COMPACT_BAR_SPACING_WIDTH = 0,
    SAMPLE_CHART_EXPANDED_HEIGHT = 160,
    SAMPLE_CHART_EXPANDED_RADIUS = 3,
    SAMPLE_CHART_EXPANDED_BAR_WIDTH = 8,
    SAMPLE_CHART_EXPANDED_BAR_SPACING_WIDTH = 1,
    FREQUENCY_BIN_CHART_HEIGHT = 250,
    FREQUENCY_BIN_CHART_RADIUS = 2,
    FREQUENCY_BIN_CHART_BAR_WIDTH = 5,
    FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH = 1,
    CONSTELLATION_DIAGRAM_WIDTH = 290,
    CONSTELLATION_DIAGRAM_HEIGHT = 290,
    CONSTELLATION_DIAGRAM_POINT_HISTORY = 1,
    FREQUENCY_BIN_TO_EXPLAIN_ITERATION_CHART_WIDTH = 90,
    FREQUENCY_BIN_TO_EXPLAIN_ITERATION_CHART_HEIGHT = 90,
    FREQUENCY_BIN_TO_EXPLAIN_ITERATION_SIZE = 32,

    // settings (user is able to update those values via form)
    sineSampleSize = 1130,

    separateSineParameter = [
        { amplitude: 0.3, samplePerPeriod: 28, phase: 0 },
        { amplitude: 0.3, samplePerPeriod: 20, phase: 0 },
        { amplitude: 0.3, samplePerPeriod: 16, phase: 0 }
    ],

    whiteNoiseAmplitude = 0,
    windowSampleOffset = 0,
    windowSampleSize = 1024,
    windowFunctionEnabled = 1,
    dBMin = -140,
    frequencyBinSize = 160,
    frequencyBinSamplePerPeriodMax = 50,
    frequencyBinSamplePerPeriodMin = 10,
    frequencyBinToExplainIndex = Math.round(frequencyBinSize * 0.85),
    frequencyBinToExplainIterationOffset = Math.round(0.392 * windowSampleSize),

    // helpers for sine creation
    separateSineCarrierGenerate = [],

    // other settings
    sectionVisibilityState = {},

    // data buffers
    separateSineQueue = [],
    summedSineQueue,
    timeDomainRawQueue,
    windowFunctionQueue,
    timeDomainProcessedQueue,
    frequencyDomainQueue,
    frequencyBinQueue,
    constellationDiagramQueue,
    timeDomainProcessedDuplicateQueue,    // its a duplicate of timeDomainProcessedQueue
    timeDomainProcessedZoomQueue,
    frequencyBinToExplainQueue = [],

    // data visualizers
    separateSineChart = [],
    summedSineChart,
    timeDomainRawChart,
    windowFunctionChart,
    timeDomainProcessedChart,
    frequencyDomainChart,
    constellationDiagramChart,
    timeDomainProcessedDuplicateChart,     // its a duplicate of timeDomainProcessedChart
    timeDomainProcessedZoomChart,
    frequencyBinToExplainChart = [];
