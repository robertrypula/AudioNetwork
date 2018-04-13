// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { IComplexFactory } from './complex/complex-factory.interface';
import { COMPLEX_FACTORY } from './complex/di-token';
import { FFT } from './fft/di-token';
import { IFft } from './fft/fft.interface';

class DspModule {
  public static $inject: string[] = [
    COMPLEX_FACTORY,
    FFT
  ];

  constructor(
    public complexFactory: IComplexFactory,
    public fft: IFft
  ) {
  }
}

export default DspModule;
