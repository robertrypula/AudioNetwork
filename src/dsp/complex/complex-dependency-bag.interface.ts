// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { ISimpleMath } from './../../common';

interface IComplexDependencyBag {
  simpleMath: ISimpleMath;
  precisionDigits: number;
  epsilon: number;
}

interface IComplexDependencyBagStatic {
  new(
    simpleMath: ISimpleMath,
    precisionDigits: number
  ): IComplexDependencyBag;
}

export {
  IComplexDependencyBag,
  IComplexDependencyBagStatic
};
