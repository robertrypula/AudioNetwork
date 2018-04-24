// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { COMPLEX_FACTORY } from './complex/di-token';
import { FOURIER_TRANSFORM } from './fourier-transform/di-token';

import { IComplexFactory } from './complex/complex-factory.interface';
import { IFourierTransform } from './fourier-transform/fourier-transform.interface';

class DspModule {
  public static $inject: string[] = [
    COMPLEX_FACTORY,
    FOURIER_TRANSFORM
  ];

  constructor(
    public complexFactory: IComplexFactory,
    public fourierTransform: IFourierTransform
  ) {
  }
}

export default DspModule;
