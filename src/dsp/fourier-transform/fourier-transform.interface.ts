// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { IList, IListFactory } from './../../common';
import { IComplexList, IComplexListDto } from './../complex-list-util/complex-list-util.interface';
import { IComplexFactory } from './../complex/complex-factory.interface';
import { IComplex } from './../complex/complex.interface';

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
