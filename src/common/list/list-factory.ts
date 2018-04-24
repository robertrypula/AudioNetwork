// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { staticImplements } from 'rr-tsdi';

import { SIMPLE_MATH } from '../../common/simple-math/di-token';

import { ISimpleMath } from './../../common/simple-math/simple-math.interface';
import List from './list';
import { IListFactory, IListFactoryStatic } from './list-factory.interface';

@staticImplements<IListFactoryStatic>()
class ListFactory implements IListFactory {
  public static $inject: string[] = [
    SIMPLE_MATH
  ];

  constructor(
    protected simpleMath: ISimpleMath
  ) {
  }

  public create<T>(maxSize: number): List<T> {
    return new List<T>(this.simpleMath, maxSize);
  }

  public createFromArray<T>(valueArray: T[], maxSize?: number): List<T> {
    let result: List<T>;
    let sizeMax: number;
    let i;

    sizeMax = (maxSize === undefined) ? valueArray.length : maxSize;
    result = new List<T>(this.simpleMath, sizeMax);
    for (i = 0; i < valueArray.length; i++) {
      result.appendEvenIfFull(valueArray[i]);
    }

    return result;
  }
}

export default ListFactory;
