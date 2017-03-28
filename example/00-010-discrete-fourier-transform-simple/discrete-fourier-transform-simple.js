// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    SAMPLE_RATE = 44100;

/**
 * In the polish 'Programista' magazine (2016/51) this method was described as intuitive and simple
 * Discrete Fourier Transform. Actually this IS NOT DFT from mathematical point of view. Frequency
 * bins that are produced are not spaced by equal amount of Hertz. Instead they are spaced by equal amount
 * of samplePerPeriod value. Additionally this function allows to pick any range of frequencies and
 * generate any amount of frequency bins inside that range. Classical DFT works mostly in range <0, N-1>
 * (where N is the timeDomain.length value) and fixed amount frequency bins.
 *
 * @param timeDomain
 * @param frequencyBinSamplePerPeriodMax
 * @param frequencyBinSamplePerPeriodMin
 * @param frequencyBinSize
 * @returns {Array}
 */

function computeNonClassicDFT(
    timeDomain,
    frequencyBinSamplePerPeriodMax,
    frequencyBinSamplePerPeriodMin,
    frequencyBinSize
) {
    var
        frequencyDomain,
        step,
        i,
        samplePerPeriod,
        frequencyBin;

    frequencyDomain = [];
    step = (frequencyBinSamplePerPeriodMax - frequencyBinSamplePerPeriodMin) / frequencyBinSize;
    for (i = 0; i < frequencyBinSize; i++) {
        samplePerPeriod = frequencyBinSamplePerPeriodMax - i * step;
        frequencyBin = getFrequencyBin(timeDomain, samplePerPeriod);
        frequencyDomain.push(frequencyBin);
    }

    return frequencyDomain;
}

/**
 * This method returns DFT output from the classic formula:
 *
 *         N-1
 *    Fk = SUM [ xn * e^(-2pi*k*n/N) ]          k in range <0, N-1>
 *         n=0
 *
 * Where:
 *   N  - timeDomain.length
 *   xn - sample of the n-th sample from timeDomain array
 *   Fk - complex number that represents amplitude and phase of the k-th frequency bin
 *
 * In order to follow approach described in the article from polish 'Programista' magazine (2016/51) exponent
 * was re-arranged in a way to use samplePerPeriod variable:
 *
 *  samplePerPeriod = N/k
 *  -2pi*k*n/N = (-2pi*n)/(N/k) = (-2pi*n) / samplePerPeriod
 *
 * @param timeDomain
 * @returns {Array}
 */
function computeDFT(timeDomain) {
    var
        frequencyDomain = [],
        N = timeDomain.length,
        samplePerPeriod,
        Fk,
        k;

    for (k = 0; k < N; k++) {
        samplePerPeriod = (k === 0)
            ? Infinity               // DC-offset
            : N / k;
        Fk = getFrequencyBin(timeDomain, samplePerPeriod);
        frequencyDomain.push(Fk);
    }

    return frequencyDomain;
}

function getFrequencyBin(timeDomain, samplePerPeriod) {
    var
        N,
        n,
        sample,
        real,
        imm,
        realNormalized,
        immNormalized,
        r,
        amplitude,
        dB,
        phase;

    N = timeDomain.length;                         // timeDomain array length is our window size
    real = 0;
    imm = 0;
    for (n = 0; n < N; n++) {
        sample = timeDomain[n];
        // TODO this formula is not like in traditional DFT, probably I should use traditional formula here and correct phase value later
        // TODO the reason to use non traditional formula was to produce correct phase angle in the end but I think that it should be changed
        // TODO to avoid any confusion
        if (samplePerPeriod === Infinity) {
            // DC-Offset case
            real += -1 * sample;
            imm += 0 * sample;
        } else {
            r = 2 * Math.PI * n / samplePerPeriod; // compute radians for 'unit vector' sine/cosine
            real += -Math.cos(r) * sample;         // 'sample' value alters 'unit vector' length, it could also change
            imm += Math.sin(r) * sample;           // direction of vector in case of negative 'sample' values
        }
    }

    realNormalized = real / N;                     // normalize final vector
    immNormalized = imm / N;                       // normalize final vector

    amplitude = Math.sqrt(                         // compute length of the vector
        realNormalized * realNormalized +
        immNormalized * immNormalized
    );
    dB = 20 * Math.log(amplitude) / Math.LN10;     // convert into decibels (in dB power is used that's why we have 20 instead 10)

    // TODO when formula from the loop will be changed to traditional we need to fix the phase because...
    // TODO ...sine waves without phase offset produces complex number that points downwards (negative imaginary axis)
    phase = findUnitAngle(real, imm);              // get angle between vector and positive Y axis clockwise

    return {
        real: real,
        imm: imm,
        // ----
        dB: dB,
        amplitude: amplitude,
        phase: phase,
        // ----
        samplePerPeriod: samplePerPeriod
    };
}

// ------------------------------------------------------------------

function findUnitAngle(x, y) {
    var length, quarter, angle;

    length = Math.sqrt(x * x + y * y);
    length = (length < 0.000001) ? 0.000001 : length;    // prevents from dividing by zero

    quarter = (x >= 0)
        ? (y >= 0 ? 0 : 1)
        : (y < 0 ? 2 : 3);

    switch (quarter) {
        case 0:
            angle = Math.asin(x / length);
            break;
        case 1:
            angle = Math.asin(-y / length) + 0.5 * Math.PI;
            break;
        case 2:
            angle = Math.asin(-x / length) + Math.PI;
            break;
        case 3:
            angle = Math.asin(y / length) + 1.5 * Math.PI;
            break;
    }

    return angle / (2 * Math.PI);   // return angle in range: <0, 1)
}

function generateSineWave(samplePerPeriod, amplitude, degreesPhaseOffset, sample) {
    var
        unitPhaseOffset = degreesPhaseOffset / 360,
        x = 2 * Math.PI * (sample / samplePerPeriod - unitPhaseOffset);

    return amplitude * Math.sin(x);
}

// ------------------------------------------------------------------

function blackmanNuttall(n, N) {
    return 0.3635819
        - 0.4891775 * Math.cos(2 * Math.PI * n / (N - 1))
        + 0.1365995 * Math.cos(4 * Math.PI * n / (N - 1))
        - 0.0106411 * Math.cos(6 * Math.PI * n / (N - 1));
}

function generateTimeDomain(windowSize) {
    var i, timeDomain, sample;

    timeDomain = [];
    for (i = 0; i < windowSize; i++) {
        sample = 0;
        sample += generateSineWave(28, 0.3, 0, i); // sine A: samplePerPeriod 28, amplitude 0.3, degreesPhaseOffset 0
        sample += generateSineWave(20, 0.3, 0, i); // sine B: samplePerPeriod 20, amplitude 0.3, degreesPhaseOffset 0
        sample += generateSineWave(16, 0.3, 0, i); // sine C: samplePerPeriod 16, amplitude 0.3, degreesPhaseOffset 0
        timeDomain.push(sample);                   // push processed sample to array
    }

    return timeDomain;
}

function addWhiteNoise(timeDomain, whiteNoiseAmplitude) {
    var i;

    for (i = 0; i < timeDomain.length; i++) {
        timeDomain[i] += (-1 + 2 * Math.random()) * whiteNoiseAmplitude;
    }
}

function applyWindowFunction(timeDomain) {
    var i, windowSize;

    windowSize = timeDomain.length;
    for (i = 0; i < windowSize; i++) {
        timeDomain[i] *= blackmanNuttall(i, windowSize);
    }
}

// ------------------------------------------------------------------

function logger(s, overwrite, cssClass) {
    var element = document.getElementById('dft-output');

    cssClass = cssClass ? cssClass : '';
    s = (s === '') ? '&nbsp;' : s;
    s = '<div class="' + cssClass + '">' + s + '</div>';

    if (overwrite) {
        element.innerHTML = s + '\n';
    } else {
        element.innerHTML = element.innerHTML + s + '\n';
    }
}

function logFrequencyBin(index, frequencyDomain, highlightText) {
    var
        fd = frequencyDomain[index],  // alias
        real,
        imm,
        dB,
        amplitude,
        phase,
        samplePerPeriod,
        frequencyInHertz,
        i,
        cssClass,
        html;

    real = fd.real.toFixed(3);
    imm = (fd.imm >= 0 ? '+' : '') + fd.imm.toFixed(3);
    dB = fd.dB.toFixed(3);
    amplitude = fd.amplitude.toFixed(3);
    phase = fd.phase.toFixed(3);
    samplePerPeriod = fd.samplePerPeriod.toFixed(3);

    frequencyInHertz = (samplePerPeriod !== Infinity)
        ? (SAMPLE_RATE / samplePerPeriod).toFixed(3)
        : 0;

    cssClass = highlightText ? 'highlight' : '';

    html = '[' + index + '] ' +
        real + ' ' + imm + 'i |' +
        dB + ' dB | ' +
        'amplitude: ' + amplitude + ' | ' +
        'phase: ' + phase + ' | ' +
        'samplePerPeriod: ' + samplePerPeriod + ' (' + frequencyInHertz + ' Hz)' +
        (highlightText ? ' | ' + highlightText : '');

    logger(html, false, cssClass);
}

// ------------------------------------------------------------------

function init() {
    var
        timeDomain,
        windowSize,
        whiteNoiseAmplitude;

    windowSize = 1024;
    whiteNoiseAmplitude = 0;
    timeDomain = generateTimeDomain(windowSize, whiteNoiseAmplitude);
    addWhiteNoise(timeDomain, whiteNoiseAmplitude);
    applyWindowFunction(timeDomain);

    logger('timeDomain.length: ' + timeDomain.length, true);
    logger('whiteNoiseAmplitude: ' + whiteNoiseAmplitude);
    logger('Sample rate for frequencies expressed in hertz: ' + SAMPLE_RATE + ' Hz');
    logger('');

    nonClassicDFT(timeDomain);  // example for algorithm described in polish 'Programista' magazine (2016/51)
    classicDFT(timeDomain);   // classic DFT
}

function nonClassicDFT(timeDomain) {
    var
        frequencyBinSamplePerPeriodMin,
        frequencyBinSamplePerPeriodMax,
        frequencyBinSize,
        frequencyDomain,
        highlightText,
        i;

    frequencyBinSamplePerPeriodMax = 50;
    frequencyBinSamplePerPeriodMin = 10;
    frequencyBinSize = 160;
    frequencyDomain = computeNonClassicDFT(
        timeDomain,
        frequencyBinSamplePerPeriodMax,
        frequencyBinSamplePerPeriodMin,
        frequencyBinSize
    );


    logger(':: Example for algorithm described in polish \'Programista\' magazine (2016/51) ::');
    logger('');
    logger('frequencyDomain.length: ' + frequencyDomain.length);

    for (i = 0; i < frequencyDomain.length; i++) {
        switch (i) {
            case 88:
                highlightText = 'Sine A';
                break;
            case 120:
                highlightText = 'Sine B';
                break;
            case 136:
                highlightText = 'Sine C';
                break;
            default:
                highlightText = undefined;
        }
        logFrequencyBin(
            i,
            frequencyDomain,
            highlightText
        );
    }

    logger('');
}

function classicDFT(timeDomain) {
    var
        frequencyDomain,
        highlightText,
        i;

    frequencyDomain = computeDFT(timeDomain);

    logger(':: Classic DFT algorithm ::');
    logger('');
    logger('frequencyDomain.length: ' + frequencyDomain.length);

    for (i = 0; i < frequencyDomain.length; i++) {
        switch (i) {
            case 0:
                highlightText = 'DC Offset';
                break;
            case 512:
                highlightText = 'Nyquist frequency';
                break;
            // positive frequencies
            case 37:
                highlightText = 'Sine A (closest bin)';
                break;
            case 51:
                highlightText = 'Sine B (closest bin)';
                break;
            case 64:
                highlightText = 'Sine C (exact bin)';
                break;
            // negative frequencies (for real valued signal it's a complex conjugate
            // of complex number obtained for same frequency but on positive side)
            case 960:
                highlightText = 'Sine C (exact bin) - negative frequency';
                break;
            case 973:
                highlightText = 'Sine B (closest bin) - negative frequency';
                break;
            case 987:
                highlightText = 'Sine A (closest bin) - negative frequency';
                break;
            default:
                highlightText = undefined;
        }

        logFrequencyBin(
            i,
            frequencyDomain,
            highlightText
        );
    }
}
