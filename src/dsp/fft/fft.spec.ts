// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { Injector } from 'rr-tsdi';

import { SIMPLE_MATH } from '../../common/simple-math/di-token';
import SimpleMath from '../../common/simple-math/simple-math';
import ComplexFactory from '../complex/complex-factory';
import { IComplexFactory } from '../complex/complex-factory.interface';
import { IComplex } from '../complex/complex.interface';
import { COMPLEX_FACTORY } from '../complex/di-token';
import { FFT } from './di-token';
import Fft from './fft';
import { IFft } from './fft.interface';

describe('Complex', () => {
  let fft: IFft;
  let complexFactory: IComplexFactory;

  beforeEach(() => {
    const injector = new Injector();

    injector.registerService(SIMPLE_MATH, SimpleMath);
    injector.registerService(COMPLEX_FACTORY, ComplexFactory);
    injector.registerService(FFT, Fft);
    fft = injector.get(FFT);
    complexFactory = injector.get(COMPLEX_FACTORY);
  });

  // TODO refactor it
  xit('should', () => {
    const input = [
      complexFactory.createPolar(0.00, 1),
      complexFactory.createPolar(0.25, 1),
      complexFactory.createPolar(0.50, 1),
      complexFactory.createPolar(0.75, 1)
    ];
    const output = fft
      .forward(input)
      .map((item: IComplex) => {
        return {
          imaginary: item.getImaginary(),
          real: item.getReal()
        };
      });

    expect(output).toEqual([
      {
        imaginary: 0,
        real: 0
      },
      {
        imaginary: 0,
        real: 0
      },
      {
        imaginary: 0,
        real: 0
      },
      {
        imaginary: 0,
        real: 0
      }
    ]);
  });

});
