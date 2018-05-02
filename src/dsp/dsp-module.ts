// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { staticImplements } from 'rr-tsdi';

import { COMPLEX_FACTORY } from './complex/di-token';
import { FOURIER_TRANSFORM } from './fourier-transform/di-token';
import { SIGNAL_FACTORY } from './signal/di-token';

import { IComplexFactory } from './complex/complex-factory.interface';
import { IDspModule, IDspModuleStatic } from './dsp-module.interface';
import { IFourierTransform } from './fourier-transform/fourier-transform.interface';
import { ISignalFactory } from './signal/signal-factory.interface';

@staticImplements<IDspModuleStatic>()
export class DspModule implements IDspModule {
  public static $inject: string[] = [
    SIGNAL_FACTORY,
    COMPLEX_FACTORY,
    FOURIER_TRANSFORM
  ];

  constructor(
    public signalFactory: ISignalFactory,
    public complexFactory: IComplexFactory,
    public fourierTransform: IFourierTransform
  ) {
  }
}
