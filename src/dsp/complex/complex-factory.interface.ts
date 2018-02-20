// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { ISimpleMath } from '../../common/simple-math/simple-math.interface';
import { IComplex } from './complex.interface';

interface IComplexFactory {
  create(real?: number, imaginary?: number): IComplex;
  createPolar(unitAngle?: number, magnitude?: number): IComplex;
}

interface IComplexFactoryStatic {
  new(simpleMath: ISimpleMath): IComplexFactory;
}

export {
  IComplexFactory,
  IComplexFactoryStatic
};
