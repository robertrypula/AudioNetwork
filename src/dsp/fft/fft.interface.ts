// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { IComplexFactory } from '../complex/complex-factory.interface';
import { IComplex } from '../complex/complex.interface';

interface IFft {
  forward(input: IComplex[]): IComplex[];
  inverse(input: IComplex[]): IComplex[];
}

interface IFftStatic {
  new(complexFactory: IComplexFactory): IFft;
}

export {
  IFft,
  IFftStatic
};
