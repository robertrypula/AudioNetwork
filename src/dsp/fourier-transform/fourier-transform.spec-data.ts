// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { IComplexListDto } from './../complex-list-util/signal-factory.interface';
import { IFourierTransformTestCase } from './fourier-transform.interface';

// All values verified using great online FFT calculator:
// http://scistatcalc.blogspot.com/2013/12/fft-calculator.html

export const fourierTransformTestCaseA: IFourierTransformTestCase = {
  input: [
    // DFT of random data...
    { real: 2.543984, imaginary: 2.524654 },
    { real: 2.525426, imaginary: 2.765865 },
    { real: 2.032369, imaginary: 2.923634 },
    { real: 2.254326, imaginary: 2.643856 },
    { real: 2.972134, imaginary: 2.653879 },
    { real: 2.346534, imaginary: 2.963433 },
    { real: 2.542170, imaginary: 2.084775 },
    { real: 2.254365, imaginary: 2.764654 }
  ],
  output: [
    // ...shoud match with data computed in external FFT calculator (see link above)
    { real: 19.471308, imaginary: 21.324750 },
    { real: 0.312114, imaginary: 0.199823 },
    { real: 1.262367, imaginary: -0.193145 },
    { real: -1.618651, imaginary: -0.711210 },
    { real: 0.710006, imaginary: -0.950866 },
    { real: 0.509304, imaginary: 0.561329 },
    { real: 0.620791, imaginary: 0.533393 },
    { real: -0.915367, imaginary: -0.566842 }
  ]
};

export const fourierTransformTestCaseB: IFourierTransformTestCase = {
  input: [
    // DFT of the single non-zero sample...
    { real: 0.000, imaginary: 0.000 },
    { real: 1.000, imaginary: 0.000 },
    { real: 0.000, imaginary: 0.000 },
    { real: 0.000, imaginary: 0.000 },
    { real: 0.000, imaginary: 0.000 },
    { real: 0.000, imaginary: 0.000 },
    { real: 0.000, imaginary: 0.000 },
    { real: 0.000, imaginary: 0.000 }
  ],
  output: [
    // ...should return one complex helix
    { real: 1.000000, imaginary: 0.000000 },
    { real: 0.707107, imaginary: -0.707107 },
    { real: 0.000000, imaginary: -1.000000 },
    { real: -0.707107, imaginary: -0.707107 },
    { real: -1.000000, imaginary: 0.000000 },
    { real: -0.707107, imaginary: 0.707107 },
    { real: 0.000000, imaginary: 1.000000 },
    { real: 0.707107, imaginary: 0.707107 }
  ]
};

export const fourierTransformTestCaseC: IFourierTransformTestCase = {
  input: [
    // DFT of the random signal with only real part...
    { real: 0.167794, imaginary: 0.000 },
    { real: 1.879908, imaginary: 0.000 },
    { real: 3.197947, imaginary: 0.000 },
    { real: 1.972958, imaginary: 0.000 },
    { real: 0.419448, imaginary: 0.000 },
    { real: -1.789019, imaginary: 0.000 },
    { real: -3.489438, imaginary: 0.000 },
    { real: -1.908498, imaginary: 0.000 }
  ],
  output: [
    // ...should return symetric result in the negative frequencies
    { real: 0.451100, imaginary: 0.000000 },
    { real: -0.401935, imaginary: -12.026312 },
    { real: 0.878733, imaginary: -0.026429 },
    { real: -0.101373, imaginary: 1.348458 },
    { real: 0.140402, imaginary: 0.000000 },
    { real: -0.101373, imaginary: -1.348458 },
    { real: 0.878733, imaginary: 0.026429 },
    { real: -0.401935, imaginary: 12.026312 }
  ]
};
