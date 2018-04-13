// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { SIMPLE_MATH } from './simple-math/di-token';
import { ISimpleMath } from './simple-math/simple-math.interface';

class CommonModule {
  public static $inject: string[] = [
    SIMPLE_MATH
  ];

  constructor(
    public simpleMath: ISimpleMath
  ) {
  }
}

export default CommonModule;
