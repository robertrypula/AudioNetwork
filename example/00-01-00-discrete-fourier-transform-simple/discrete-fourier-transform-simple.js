// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

// UPDATE 2017.08.16
// if you are looking for object oriented solution plase look at:
// - https://audio-network.rypula.pl/wave-analyser-class
// - https://audio-network.rypula.pl/wave-generator-class

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
 * This method will produce classic Discrete Fourier Transform output
 *
 * @param timeDomain
 * @returns {Array}
 */
function computeDFT(timeDomain) {
    var
        frequencyDomain = [],
        N = timeDomain.length,
        samplePerPeriod,
        frequencyBin,
        k;

    for (k = 0; k < N; k++) {
        samplePerPeriod = (k === 0)
            ? Infinity               // DC-offset (0 Hz)
            : N / k;
        frequencyBin = getFrequencyBin(timeDomain, samplePerPeriod);
        frequencyDomain.push(frequencyBin);
    }

    return frequencyDomain;
}

/**
 * This method returns frequency bin from the classic DFT formula:
 *
 *         N-1
 *    Fk = SUM [ xn * e^(-i*2*PI*k*n/N) ]
 *         n=0
 *
 * Where:
 *   e^(i*x) -> Euler's formula that produces complex number: cos(x) + i*sin(x)
 *   N       -> timeDomain.length
 *   i       -> sqrt(-1)
 *   PI      -> ~3.14
 *   xn      -> value of the n-th sample from timeDomain array
 *   n       -> sample index from timeDomain array
 *   k       -> number of cycles of a wave that fully fits the window, it's different for every frequency bins
 *   Fk      -> complex number that represents amplitude and phase of the k-th frequency bin
 *
 * In order to follow approach described in the article from polish 'Programista' magazine (2016/51) exponent
 * was re-arranged in a way to use samplePerPeriod variable:
 *
 *  samplePerPeriod = N/k
 *  -i*2*PI*k*n/N = (-i*2*PI*n)/(N/k) = (-i*2*PI*n) / samplePerPeriod
 *
 * @param timeDomain
 * @param samplePerPeriod
 * @returns {{real: number, imag: number, dB: (number|*), amplitude: (number|*), phase: *, samplePerPeriod: *}}
 */
function getFrequencyBin(timeDomain, samplePerPeriod) {
    var
        N,
        n,
        xn,
        realUnit,
        imagUnit,
        real,
        imag,
        realNormalized,
        imagNormalized,
        r,
        amplitude,
        dB,
        phase;

    N = timeDomain.length;                         // timeDomain array length is our window size
    real = 0;
    imag = 0;
    for (n = 0; n < N; n++) {
        xn = timeDomain[n];

        r = (samplePerPeriod === Infinity)
            ? 0                                    // DC-Offset case (0 Hz -> samplePerPeriod is Infinite)
            : -2 * Math.PI * n / samplePerPeriod;

        realUnit = Math.cos(r);                    // 'in-phase' component
        imagUnit = Math.sin(r);                    // 'quadrature' component

        // value of the sample alters 'unit vector' length
        // it could also 'rotate' vector 180 degrees in case of negative value
        real += realUnit * xn;
        imag += imagUnit * xn;
    }

    realNormalized = real / N;                     // normalize final vector
    imagNormalized = imag / N;                     // normalize final vector
    amplitude = Math.sqrt(                         // compute length of the vector
        realNormalized * realNormalized +
        imagNormalized * imagNormalized
    );

    dB = 20 * Math.log(amplitude) / Math.LN10;     // convert into decibels (dB value computed from amplitudes needs to have 20 instead 10)

    phase = getPhaseFromComplexNumber(real, imag);  // phase of a sine wave related to this frequency bin

    return {
        real: real,
        imag: imag,
        // extras
        dB: dB,
        amplitude: amplitude,
        phase: phase,
        samplePerPeriod: samplePerPeriod
    };
}

// ------------------------------------------------------------------

function getPhaseFromComplexNumber(real, imag) {
    var phase;

    // get angle between positive X axis and vector counter-clockwise
    phase = findUnitAngle(real, imag);
    // sine wave without any phase offset is a complex number with real part equal zero
    // and imaginary part on the negative side (vector pointing downwards -> 270 degrees)
    phase = phase - 0.75;
    // correction from line above may produce negative phase so we need to fix it
    phase = phase < 0 ? phase + 1 : phase;
    // fix direction - when sine wave is moving to the right in time domain
    // then phase angle should increase counter-clockwise
    phase = 1 - phase;

    return phase;
}

function findUnitAngle(x, y) {
    var length, quarter, angle;

    length = Math.sqrt(x * x + y * y);
    length = (length < 0.000001) ? 0.000001 : length;    // prevents from dividing by zero

    //         ^             Legend:
    //  II     *     I        '!' = 0 degrees
    //         |              '*' = 90 degrees
    //  ----@--+--!---->      '@' = 180 degrees
    //         |              '%' = 270 degrees
    //  III    %     IV

    quarter = (y >= 0)
        ? (x >= 0 ? 1 : 2)
        : (x <= 0 ? 3 : 4);

    switch (quarter) {
        case 1:
            angle = Math.asin(y / length);
            break;
        case 2:
            angle = Math.asin(-x / length) + 0.5 * Math.PI;
            break;
        case 3:
            angle = Math.asin(-y / length) + 1.0 * Math.PI;
            break;
        case 4:
            angle = Math.asin(x / length) + 1.5 * Math.PI;
            break;
    }

    return angle / (2 * Math.PI);   // returns angle in range: <0, 1)
}

// ------------------------------------------------------------------

function generateSineWave(samplePerPeriod, amplitude, phaseInDegrees, sample) {
    var
        phase = phaseInDegrees / 360,
        x = 2 * Math.PI * (sample / samplePerPeriod - phase);

    return amplitude * Math.sin(x);
}

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
        sample += generateSineWave(28, 0.3, 0, i);  // sine A: samplePerPeriod 28, amplitude 0.3, phaseInDegrees 0
        sample += generateSineWave(20, 0.3, 0, i);  // sine B: samplePerPeriod 20, amplitude 0.3, phaseInDegrees 0
        sample += generateSineWave(16, 0.3, 0, i);  // sine C: samplePerPeriod 16, amplitude 0.3, phaseInDegrees 0
        timeDomain.push(sample);                    // push processed sample to array
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
        imag,
        dB,
        amplitude,
        phase,
        samplePerPeriod,
        frequencyInHertz,
        i,
        cssClass,
        html;

    real = fd.real.toFixed(3);
    imag = (fd.imag >= 0 ? '+' : '') + fd.imag.toFixed(3);
    dB = fd.dB.toFixed(3);
    amplitude = fd.amplitude.toFixed(3);
    phase = Math.round(fd.phase * 360) % 360;
    samplePerPeriod = fd.samplePerPeriod.toFixed(3);

    frequencyInHertz = (samplePerPeriod !== Infinity)
        ? (SAMPLE_RATE / samplePerPeriod).toFixed(3)
        : 0;

    cssClass = highlightText ? 'highlight' : '';

    html = '[' + index + '] ' +
        real + ' ' + imag + 'i |' +
        dB + ' dB | ' +
        'amplitude: ' + amplitude + ' | ' +
        'phase: ' + phase + ' deg | ' +
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
    classicDFT(timeDomain);     // classic DFT
}

function nonClassicDFT(timeDomain) {
    var
        frequencyBinSamplePerPeriodMin,
        frequencyBinSamplePerPeriodMax,
        frequencyBinSize,
        frequencyDomain,
        highlightText,
        i;

    frequencyBinSamplePerPeriodMax = 50;    // lowest frequency in hertz
    frequencyBinSamplePerPeriodMin = 10;    // highest frequency in hertz
    frequencyBinSize = 160;                 // how many frequency bin in that range will be generated
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
            // of complex number obtained for same frequency on positive side)
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
