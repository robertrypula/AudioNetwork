// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    CarrierGenerate = AudioNetwork.Common.CarrierGenerate,
    SampleChart = AudioNetwork.Visualizer.SampleChart,
    Queue = AudioNetwork.Common.Queue;

var
    SAMPLE_RATE = 100,
    FPS = 50,
    CHART_WIDTH = 800,
    CHART_HEIGHT = 100,

    FREQUENCY = 5,
    SAMPLE_PER_FREQUENCY = SAMPLE_RATE / FREQUENCY,

    carrierGenerate = new CarrierGenerate(SAMPLE_PER_FREQUENCY),
    chartElement = document.getElementById('chart'),
    queue = new Queue(CHART_WIDTH),
    sampleChart = new SampleChart(chartElement, CHART_WIDTH, CHART_HEIGHT, queue);

function test() {
    carrierGenerate.addToQueue({
        duration: Math.round(SAMPLE_RATE * 1.0),
        phase: 0,
        amplitude: 0.25
    });
}

function draw() {
    var i;

    for (i = 0; i < Math.round(SAMPLE_RATE / FPS); i++) {
        queue.pushEvenIfFull(
            carrierGenerate.getSample() + Math.random() * 0.05
        );

        carrierGenerate.nextSample();
    }
}

setInterval(draw, Math.round(1000 / FPS));
