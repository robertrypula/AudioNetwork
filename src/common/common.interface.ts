// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { IListFactory } from './list/list-factory.interface';
import { ISimpleMath } from './simple-math/simple-math.interface';

interface ICommonModule {
  listFactory: IListFactory;
  simpleMath: ISimpleMath;
}

interface ICommonModuleStatic {
  new(
    listFactory: IListFactory,
    simpleMath: ISimpleMath
  ): ICommonModule;
}

export {
  ICommonModule,
  ICommonModuleStatic
};
