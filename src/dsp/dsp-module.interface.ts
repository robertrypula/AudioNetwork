// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { IComplexListUtil } from './complex-list-util/complex-list-util.interface';
import { IComplexFactory } from './complex/complex-factory.interface';
import { IFourierTransform } from './fourier-transform/fourier-transform.interface';

interface IDspModule {
  complexListUtil: IComplexListUtil;
  complexFactory: IComplexFactory;
  fourierTransform: IFourierTransform;
}

interface IDspModuleStatic {
  new(
    complexListUtil: IComplexListUtil,
    complexFactory: IComplexFactory,
    fourierTransform: IFourierTransform
  ): IDspModule;
}

export {
  IDspModule,
  IDspModuleStatic
};
