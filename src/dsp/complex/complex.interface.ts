// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { ISimpleMath } from './../../common/simple-math/simple-math.interface';

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
  toDto(): IComplexDto;
}

interface IComplexStatic {
  new(
    simpleMath: ISimpleMath,
    real: number,
    imaginary: number
  ): IComplex;
}

export {
  IComplexDto,
  IComplex,
  IComplexStatic
};
