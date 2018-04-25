// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { ISimpleMath } from './../../common';
import { IComplex, IComplexDto } from './complex.interface';

interface IComplexFactory {
  create(real?: number, imaginary?: number): IComplex;
  createPolar(unitAngle?: number, magnitude?: number): IComplex;
  createFromDto(complexDto: IComplexDto): IComplex;
}

interface IComplexFactoryStatic {
  new(
    simpleMath: ISimpleMath
  ): IComplexFactory;
}

export {
  IComplexFactory,
  IComplexFactoryStatic
};
