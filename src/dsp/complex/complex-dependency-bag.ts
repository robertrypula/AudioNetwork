// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { staticImplements } from 'rr-tsdi';

import { SIMPLE_MATH } from './../../common';
import { PRECISION_DIGITS } from './../../di-token';

import { ISimpleMath } from './../../common';
import { IComplexDependencyBag, IComplexDependencyBagStatic } from './complex-dependency-bag.interface';

@staticImplements<IComplexDependencyBagStatic>()
export class ComplexDependencyBag implements IComplexDependencyBag {
  public static $inject: string[] = [
    SIMPLE_MATH,
    PRECISION_DIGITS
  ];

  public epsilon: number;

  constructor(
    public simpleMath: ISimpleMath,
    public precisionDigits: number
  ) {
    this.epsilon = simpleMath.pow(10, -precisionDigits);
  }
}
