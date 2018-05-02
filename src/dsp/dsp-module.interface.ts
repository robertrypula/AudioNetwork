// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { ISignalFactory } from './complex-list-util/signal-factory.interface';
import { IComplexFactory } from './complex/complex-factory.interface';
import { IFourierTransform } from './fourier-transform/fourier-transform.interface';

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
