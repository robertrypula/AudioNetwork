// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { IListFactory } from '../../common/list/list-factory.interface';
import { IList } from '../../common/list/list.interface';
import { IComplexFactory } from '../complex/complex-factory.interface';
import { IComplex } from '../complex/complex.interface';

interface IFourierTransform {
  forward(input: IList<IComplex>): IList<IComplex>;
  inverse(input: IList<IComplex>): IList<IComplex>;
}

interface IFourierTransformStatic {
  new(
    listFactory: IListFactory,
    complexFactory: IComplexFactory
  ): IFourierTransform;
}

export {
  IFourierTransform,
  IFourierTransformStatic
};
