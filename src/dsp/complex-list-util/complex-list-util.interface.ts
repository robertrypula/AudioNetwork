// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { IList, IListFactory } from './../../common';
import { IComplexFactory } from './../complex/complex-factory.interface';
import { IComplex, IComplexDto } from './../complex/complex.interface';

type IComplexListDto = IComplexDto[];

interface IComplexListUtil {
  fromDto(complexListDto: IComplexListDto): IList<IComplex>;
  // fromRawIQ(dto: number[]): IList<IComplex>;
  toDto(complexList: IList<IComplex>): IComplexListDto;
  // toRawIQ(list: IList<IComplex>): number[];
  // isEqual(a: IList<IComplex>, b: IList<IComplex>): boolean;
}

interface IComplexListUtilStatic {
  new(
    complexFactory: IComplexFactory,
    listFactory: IListFactory
  ): IComplexListUtil;
}

export {
  IComplexListDto,
  IComplexListUtil,
  IComplexListUtilStatic
};
