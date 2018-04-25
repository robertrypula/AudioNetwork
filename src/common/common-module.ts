// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { staticImplements } from 'rr-tsdi';

import { LIST_FACTORY } from './list/di-token';
import { SIMPLE_MATH } from './simple-math/di-token';

import { ICommonModule, ICommonModuleStatic } from './common.interface';
import { IListFactory } from './list/list-factory.interface';
import { ISimpleMath } from './simple-math/simple-math.interface';

@staticImplements<ICommonModuleStatic>()
class CommonModule implements ICommonModule {
  public static $inject: string[] = [
    LIST_FACTORY,
    SIMPLE_MATH
  ];

  constructor(
    public listFactory: IListFactory,
    public simpleMath: ISimpleMath
  ) {
  }
}

export default CommonModule;
