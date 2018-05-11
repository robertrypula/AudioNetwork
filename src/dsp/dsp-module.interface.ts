// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { IComplexFactory } from './complex/complex-factory.interface';
import { IFourierTransform } from './fourier-transform/fourier-transform.interface';
import { ISignalFactory } from './signal/signal-factory.interface';

interface IDspModule {
  signalFactory: ISignalFactory;
  complexFactory: IComplexFactory;
  fourierTransform: IFourierTransform;
}

interface IDspModuleStatic {
  new(
    signalFactory: ISignalFactory,
    complexFactory: IComplexFactory,
    fourierTransform: IFourierTransform
  ): IDspModule;
}

export {
  IDspModule,
  IDspModuleStatic
};
