// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { IList, IListFactory } from './../../common';
import { IComplexFactory } from './../complex/complex-factory.interface';
import { IComplex, IComplexDto } from './../complex/complex.interface';

type IComplexListDto = IComplexDto[];
type IComplexList = IList<IComplex>;

interface ISignalFactory {
  fromDto(complexListDto: IComplexListDto): IComplexList;
  fromRawIQ(rawIQ: number[]): IComplexList;
  toDto(complexList: IComplexList): IComplexListDto;
  toRawIQ(complexList: IComplexList): number[];
  isEqual(a: IComplexList, b: IComplexList): boolean;
}

interface ISignalFactoryStatic {
  new(
    complexFactory: IComplexFactory,
    listFactory: IListFactory
  ): ISignalFactory;
}

export {
  IComplexListDto,
  IComplexList,
  ISignalFactory,
  ISignalFactoryStatic
};
