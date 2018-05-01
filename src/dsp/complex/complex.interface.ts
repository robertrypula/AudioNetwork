// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { IComplexDependencyBag } from './complex-dependency-bag.interface';

interface IComplexDto {
  real: number;
  imaginary: number;
}

interface IComplex {
  clone(): IComplex;
  swap(): IComplex;
  add(x: IComplex): IComplex;
  subtract(x: IComplex): IComplex;
  multiply(x: IComplex): IComplex;
  conjugate(): IComplex;
  multiplyScalar(x: number): IComplex;
  divideScalar(x: number): IComplex;
  getReal(): number;
  getImaginary(): number;
  getMagnitude(): number;
  getUnitAngle(): number;
  normalize(): IComplex;
  isEqualTo(b: IComplex): boolean;
  toDto(): IComplexDto;
  toRawIQ(): number[];
}

interface IComplexStatic {
  new(
    complexDependencyBag: IComplexDependencyBag,
    real: number,
    imaginary: number
  ): IComplex;
}

export {
  IComplexDto,
  IComplex,
  IComplexStatic
};
