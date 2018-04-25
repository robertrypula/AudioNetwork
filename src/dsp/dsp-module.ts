// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { staticImplements } from 'rr-tsdi';

import { COMPLEX_LIST_UTIL } from './complex-list-util/di-token';
import { COMPLEX_FACTORY } from './complex/di-token';
import { FOURIER_TRANSFORM } from './fourier-transform/di-token';

import { IComplexListUtil } from './complex-list-util/complex-list-util.interface';
import { IComplexFactory } from './complex/complex-factory.interface';
import { IDspModule, IDspModuleStatic } from './dsp-module.interface';
import { IFourierTransform } from './fourier-transform/fourier-transform.interface';

@staticImplements<IDspModuleStatic>()
class DspModule implements IDspModule {
  public static $inject: string[] = [
    COMPLEX_LIST_UTIL,
    COMPLEX_FACTORY,
    FOURIER_TRANSFORM
  ];

  constructor(
    public complexListUtil: IComplexListUtil,
    public complexFactory: IComplexFactory,
    public fourierTransform: IFourierTransform
  ) {
  }
}

export default DspModule;
