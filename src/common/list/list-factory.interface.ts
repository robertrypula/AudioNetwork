// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { ISimpleMath } from './../simple-math/simple-math.interface';
import { IList } from './list.interface';

interface IListFactory {
  create<T>(maxSize: number): IList<T>;
  createFromArray<T>(valueArray: T[], maxSize?: number): IList<T>;
}

interface IListFactoryStatic {
  new(simpleMath: ISimpleMath): IListFactory;
}

export {
  IListFactory,
  IListFactoryStatic
};
