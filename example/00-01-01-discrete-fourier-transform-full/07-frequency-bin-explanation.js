// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

function frequencyBinExplanationInitialize() {
    var element, chartWidth, i, chartTemplate, chartAllTemplate, queue, chart;

    // time domain processed duplicate
    timeDomainProcessedDuplicateQueue = timeDomainProcessedQueue;     // exactly same data as timeDomainProcessedQueue
    element = document.getElementById('time-domain-processed-duplicate');
    chartWidth = windowSampleSize * (SAMPLE_CHART_COMPACT_BAR_WIDTH + SAMPLE_CHART_COMPACT_BAR_SPACING_WIDTH);
    timeDomainProcessedDuplicateChart = new SampleChart(
        element, chartWidth, SAMPLE_CHART_COMPACT_HEIGHT, timeDomainProcessedDuplicateQueue,
        SAMPLE_CHART_COMPACT_RADIUS, SAMPLE_CHART_COMPACT_BAR_WIDTH, SAMPLE_CHART_COMPACT_BAR_SPACING_WIDTH
    );

    // range marker
    element = document.getElementById('time-domain-processed-duplicate-visualizer-overlay');
    element.style.height = SAMPLE_CHART_COMPACT_HEIGHT + 'px';
    element.style.top = -SAMPLE_CHART_COMPACT_HEIGHT + 'px';

    // time domain processed zoom
    timeDomainProcessedZoomQueue = new Queue(FREQUENCY_BIN_TO_EXPLAIN_ITERATION_SIZE);
    element = document.getElementById('time-domain-processed-zoom');
    chartWidth = FREQUENCY_BIN_TO_EXPLAIN_ITERATION_SIZE
        * (SAMPLE_CHART_EXPANDED_BAR_WIDTH + SAMPLE_CHART_EXPANDED_BAR_SPACING_WIDTH);
    timeDomainProcessedZoomChart = new SampleChart(
        element, chartWidth, SAMPLE_CHART_EXPANDED_HEIGHT, timeDomainProcessedZoomQueue,
        SAMPLE_CHART_EXPANDED_RADIUS, SAMPLE_CHART_EXPANDED_BAR_WIDTH, SAMPLE_CHART_EXPANDED_BAR_SPACING_WIDTH
    );

    // iteration charts - generate html
    element = document.getElementById('frequency-bin-iteration-container');
    chartTemplate = element.innerHTML;
    chartAllTemplate = '';
    for (i = 0; i < FREQUENCY_BIN_TO_EXPLAIN_ITERATION_SIZE; i++) {
        chartAllTemplate += chartTemplate.replace(/\[\[ index \]\]/g, i.toString());
    }
    element.innerHTML = chartAllTemplate;

    // iteration charts - initialize
    for (i = 0; i < FREQUENCY_BIN_TO_EXPLAIN_ITERATION_SIZE; i++) {
        queue = new Queue(2);
        element = document.getElementById('frequency-bin-iteration-' + i);
        chart = new ComplexPlaneChart(
            element,
            FREQUENCY_BIN_TO_EXPLAIN_ITERATION_CHART_WIDTH, FREQUENCY_BIN_TO_EXPLAIN_ITERATION_CHART_HEIGHT,
            queue,
            1.1
        );
        frequencyBinToExplainQueue.push(queue);
        frequencyBinToExplainChart.push(chart);
    }
}

function frequencyBinExplanationUpdate() {
    var element, chartWidth, i, queue, frequencyBin, frequencyBinIteration;

    // update frequency bin marker
    element = document.getElementById('frequency-domain-visualizer-overlay');
    element.style.left =
        ((FREQUENCY_BIN_CHART_BAR_WIDTH + FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH) * frequencyBinToExplainIndex) + 'px';

    // update duplicated time domain chart
    chartWidth = windowSampleSize * (SAMPLE_CHART_COMPACT_BAR_WIDTH + SAMPLE_CHART_COMPACT_BAR_SPACING_WIDTH);
    timeDomainProcessedDuplicateChart.setWidth(chartWidth);

    // range marker update
    element = document.getElementById('time-domain-processed-duplicate-visualizer-overlay');
    element.style.left = frequencyBinToExplainIterationOffset + 'px';
    element.style.width = FREQUENCY_BIN_TO_EXPLAIN_ITERATION_SIZE + 'px';

    // time domain processed zoom
    for (i = 0; i < FREQUENCY_BIN_TO_EXPLAIN_ITERATION_SIZE; i++) {
        timeDomainProcessedZoomQueue.pushEvenIfFull(
            timeDomainProcessedQueue.getItem(frequencyBinToExplainIterationOffset + i)
        );
    }

    // iteration charts
    for (i = 0; i < FREQUENCY_BIN_TO_EXPLAIN_ITERATION_SIZE; i++) {
        queue = frequencyBinToExplainQueue[i];
        element = document.getElementById('frequency-bin-iteration-label-' + i);
        frequencyBin = frequencyBinQueue.getItem(frequencyBinToExplainIndex);
        frequencyBinIteration = frequencyBin.detail[frequencyBinToExplainIterationOffset + i];
        queue.pushEvenIfFull({
            real: frequencyBinIteration.realUnit,
            imm: frequencyBinIteration.immUnit,
            line: false,
            point: true,
            pointColor: '#666',
            pointRadius: 2.5
        });
        queue.pushEvenIfFull({
            real: frequencyBinIteration.real,
            imm: frequencyBinIteration.imm,
            line: true,
            lineColor: '#738BD7',
            lineWidth: 3,
            point: true,
            pointColor: '#738BD7',
            pointRadius: 2.5
        });
        element.innerHTML = (frequencyBinToExplainIterationOffset + i).toString();
    }
}
