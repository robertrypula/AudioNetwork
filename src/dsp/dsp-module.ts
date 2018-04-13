// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { IComplexFactory } from './complex/complex-factory.interface';
import { COMPLEX_FACTORY } from './complex/di-token';

class DspModule {
  public static $inject: string[] = [
    COMPLEX_FACTORY
  ];

  constructor(
    public complexFactory: IComplexFactory
  ) {
  }
}

export default DspModule;
