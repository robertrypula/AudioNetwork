'use strict';

var
    // import stuff from AudioNetwork lib
    CarrierGenerate = AudioNetwork.Common.CarrierGenerate,
    SampleChart = AudioNetwork.Visualizer.SampleChart,
    Queue = AudioNetwork.Common.Queue,

    SAMPLE_RATE = 441,
    FPS = 50,
    CHART_WIDTH = 800,
    CHART_HEIGHT = 100,

    FREQUENCY = 8,
    SAMPLE_PER_FREQUENCY = SAMPLE_RATE / FREQUENCY,

    carrierGenerate = new CarrierGenerate(SAMPLE_PER_FREQUENCY),
    chartElement = document.getElementById('chart'),
    queue = new Queue(CHART_WIDTH),
    sampleChart = new SampleChart(chartElement, CHART_WIDTH, CHART_HEIGHT, queue);

function test() {
    carrierGenerate.addToQueue({
        duration: Math.round(SAMPLE_RATE * 0.5),
        phase: 0,
        amplitude: 1
    });
}

function draw() {
    var i;

    for (i = 0; i < Math.round(SAMPLE_RATE / FPS); i++) {
        queue.pushEvenIfFull(
            -20 + 15 * carrierGenerate.getSample()
            //+ Math.random() * 5
        );

        carrierGenerate.nextSample();
    }
}

setInterval(draw, Math.round(1000 / FPS));

