// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { IComplexListDto } from '../complex-list-util/complex-list-util.interface';
import { IFourierTransformTestCase } from './fourier-transform.interface';

export const fourierTransformTestCaseA: IFourierTransformTestCase = {
  input: [
    { real: 342.000, imaginary: 0.000 },
    { real: 654.000, imaginary: 0.000 },
    { real: 436.000, imaginary: 0.000 },
    { real: 46.000, imaginary: 0.000 },
    { real: 745.000, imaginary: 0.000 },
    { real: 24.000, imaginary: 0.000 },
    { real: 74.000, imaginary: 0.000 },
    { real: 46.000, imaginary: 0.000 }
  ],
  output: [
    { real: 2367.000000, imaginary: 0.000000 },
    { real: 42.477272, imaginary: -807.477272 },
    { real: 577.000000, imaginary: -586.000000 },
    { real: -848.477272, imaginary: -83.477272 },
    { real: 827.000000, imaginary: 0.000000 },
    { real: -848.477272, imaginary: 83.477272 },
    { real: 577.000000, imaginary: 586.000000 },
    { real: 42.477272, imaginary: 807.477272 }
  ]
};

export const fourierTransformTestCaseB: IFourierTransformTestCase = {
  input: [
    { real: 0.000, imaginary: 0.000 },
    { real: 0.000, imaginary: 0.000 },
    { real: 0.000, imaginary: 0.000 },
    { real: 0.000, imaginary: 0.000 }
  ],
  output: [
    { real: 0.000, imaginary: 0.000 },
    { real: 0.000, imaginary: 0.000 },
    { real: 0.000, imaginary: 0.000 },
    { real: 0.000, imaginary: 0.000 }
  ]
};
