// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { IComplexDependencyBag } from './complex-dependency-bag.interface';
import { IComplex, IComplexDto } from './complex.interface';

interface IComplexFactory {
  create(real?: number, imaginary?: number): IComplex;
  createPolar(unitAngle?: number, magnitude?: number): IComplex;
  createFromDto(complexDto: IComplexDto): IComplex;
  createFromRawIQ(rawIq: number[]): IComplex;
}

interface IComplexFactoryStatic {
  new(
    complexDependencyBag: IComplexDependencyBag
  ): IComplexFactory;
}

export {
  IComplexFactory,
  IComplexFactoryStatic
};
