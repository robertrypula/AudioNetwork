// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { IList, IListFactory } from './../../common';
import { IComplexFactory } from './../complex/complex-factory.interface';
import { IComplex } from './../complex/complex.interface';
import { IComplexList, IComplexListDto } from './../signal/signal-factory.interface';

interface IFourierTransform {
  forward(input: IComplexList): IComplexList;
  inverse(input: IComplexList): IComplexList;
}

interface IFourierTransformStatic {
  new(
    listFactory: IListFactory,
    complexFactory: IComplexFactory
  ): IFourierTransform;
}

interface IFourierTransformTestCase {
  input: IComplexListDto;
  output: IComplexListDto;
}

export {
  IFourierTransform,
  IFourierTransformStatic,
  IFourierTransformTestCase
};
