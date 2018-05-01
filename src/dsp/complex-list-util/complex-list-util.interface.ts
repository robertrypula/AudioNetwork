// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { IList, IListFactory } from './../../common';
import { IComplexFactory } from './../complex/complex-factory.interface';
import { IComplex, IComplexDto } from './../complex/complex.interface';

type IComplexListDto = IComplexDto[];
type IComplexList = IList<IComplex>;

interface IComplexListUtil {
  fromDto(complexListDto: IComplexListDto): IComplexList;
  fromRawIQ(rawIQ: number[]): IComplexList;
  toDto(complexList: IComplexList): IComplexListDto;
  toRawIQ(complexList: IComplexList): number[];
  isEqual(a: IComplexList, b: IComplexList): boolean;
}

interface IComplexListUtilStatic {
  new(
    complexFactory: IComplexFactory,
    listFactory: IListFactory
  ): IComplexListUtil;
}

export {
  IComplexListDto,
  IComplexList,
  IComplexListUtil,
  IComplexListUtilStatic
};
