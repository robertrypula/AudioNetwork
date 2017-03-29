// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

function dataBindingTemplateToCode() {
    var i, ssp;

    sineSampleSize = parseIntFromForm('form-sine-sample-size');
    for (i = 0; i < separateSineParameter.length; i++) {
        ssp = separateSineParameter[i];
        ssp.samplePerPeriod = parseFloatFromForm('form-sine-' + i + '-sample-per-period');
        ssp.amplitude = parseFloatFromForm('form-sine-' + i + '-amplitude');
        ssp.phase = parseFloatFromForm('form-sine-' + i + '-phase');
    }
    whiteNoiseAmplitude = parseFloatFromForm('form-white-noise-amplitude');
    windowSampleOffset = parseIntFromForm('form-window-sample-offset');
    windowSampleSize = parseIntFromForm('form-window-sample-size');
    windowFunctionEnabled = !!document.getElementById('form-window-function-enabled').checked;
    amplitudeDecibelMin = parseIntFromForm('form-amplitude-decibel-min');
    frequencyBinSize = parseIntFromForm('form-frequency-bin-size');
    frequencyBinSamplePerPeriodMax = parseFloatFromForm('form-frequency-bin-sample-per-period-max');
    frequencyBinSamplePerPeriodMin = parseFloatFromForm('form-frequency-bin-sample-per-period-min');
    frequencyBinToExplainIndex = parseIntFromForm('form-frequency-bin-to-explain-index');
    frequencyBinToExplainIterationOffset = parseIntFromForm('form-frequency-bin-to-explain-iteration-offset');
}

function dataBindingCodeToTemplate() {
    var i, key, ssp, elementList, headerElement, contentElement, visible;

    document.getElementById('form-sine-sample-size').value = sineSampleSize;
    for (i = 0; i < separateSineParameter.length; i++) {
        ssp = separateSineParameter[i];
        document.getElementById('form-sine-' + i + '-sample-per-period').value = ssp.samplePerPeriod;
        document.getElementById('form-sine-' + i + '-amplitude').value = ssp.amplitude;
        document.getElementById('form-sine-' + i + '-phase').value = ssp.phase;
    }
    document.getElementById('form-white-noise-amplitude').value = whiteNoiseAmplitude;
    document.getElementById('form-window-sample-offset').value = windowSampleOffset;
    document.getElementById('form-window-sample-size').value = windowSampleSize;
    document.getElementById('form-window-function-enabled').checked = windowFunctionEnabled ? true : false;
    document.getElementById('form-amplitude-decibel-min').value = amplitudeDecibelMin;
    document.getElementById('form-frequency-bin-size').value = frequencyBinSize;
    document.getElementById('form-frequency-bin-sample-per-period-max').value = frequencyBinSamplePerPeriodMax;
    document.getElementById('form-frequency-bin-sample-per-period-min').value = frequencyBinSamplePerPeriodMin;
    document.getElementById('form-frequency-bin-to-explain-index').value = frequencyBinToExplainIndex;
    document.getElementById('frequency-bin-sample-per-period').innerHTML =
        (Math.round(getSamplePerPeriodFromIndex(frequencyBinToExplainIndex) * 100) / 100).toString();
    document.getElementById('frequency-bin-frequency').innerHTML =
        (Math.round(getFrequencyFromIndex(frequencyBinToExplainIndex) * 100) / 100).toString();
    document.getElementById('frequency-bin-amplitude-decibel').innerHTML =
        (Math.round(frequencyBinQueue.getItem(frequencyBinToExplainIndex).amplitudeDecibel * 100) / 100).toString();
    document.getElementById('frequency-bin-phase').innerHTML =
        (Math.round(frequencyBinQueue.getItem(frequencyBinToExplainIndex).phase * 360) % 360).toString();
    document.getElementById('form-frequency-bin-to-explain-iteration-offset').value =
        frequencyBinToExplainIterationOffset;

    elementList = document.querySelectorAll('.SAMPLE_RATE');
    for (i = 0; i < elementList.length; i++) {
        elementList[i].innerHTML = SAMPLE_RATE.toString();
    }

    elementList = document.querySelectorAll('.FREQUENCY_BIN_TO_EXPLAIN_ITERATION_SIZE');
    for (i = 0; i < elementList.length; i++) {
        elementList[i].innerHTML = FREQUENCY_BIN_TO_EXPLAIN_ITERATION_SIZE.toString();
    }

    for (key in sectionVisibilityState) {
        if (!sectionVisibilityState.hasOwnProperty(key)) {
            continue;
        }
        visible = sectionVisibilityState[key];
        headerElement = document.getElementById('section-' + key);
        contentElement = document.getElementById('section-' + key + '-content');
        if (visible) {
            headerElement.className = '';
            contentElement.className = '';
        } else {
            headerElement.className = 'section-header-hidden';
            contentElement.className = 'section-content-hidden';
        }
    }
}

function onSectionToggleClick(name) {
    if (typeof sectionVisibilityState[name] === 'undefined') {
        sectionVisibilityState[name] = false;
    } else {
        sectionVisibilityState[name] = !sectionVisibilityState[name];
    }

    dataBindingCodeToTemplate();
}

function formSineDataChanged() {
    dataBindingTemplateToCode();

    separateSineUpdate();
    summedSineUpdate();
    timeDomainRawUpdate();
    windowFunctionUpdate();
    timeDomainProcessedUpdate();
    discreteFourierTransformUpdate();
    constellationDiagramUpdate();
    frequencyBinExplanationUpdate();

    dataBindingCodeToTemplate();
}

function formWindowDataChanged() {
    dataBindingTemplateToCode();

    timeDomainRawUpdate();
    windowFunctionUpdate();
    timeDomainProcessedUpdate();
    discreteFourierTransformUpdate();
    constellationDiagramUpdate();
    frequencyBinExplanationUpdate();

    dataBindingCodeToTemplate();
}

function formWindowFunctionDataChanged() {
    dataBindingTemplateToCode();

    windowFunctionUpdate();
    timeDomainProcessedUpdate();
    discreteFourierTransformUpdate();
    constellationDiagramUpdate();
    frequencyBinExplanationUpdate();

    dataBindingCodeToTemplate();
}

function formFrequencyDomainDataChanged() {
    dataBindingTemplateToCode();

    discreteFourierTransformUpdate();
    constellationDiagramUpdate();
    frequencyBinExplanationUpdate();

    dataBindingCodeToTemplate();
}

function formFrequencyBinExplanationDataChanged() {
    dataBindingTemplateToCode();

    constellationDiagramUpdate();
    frequencyBinExplanationUpdate();

    dataBindingCodeToTemplate();
}
