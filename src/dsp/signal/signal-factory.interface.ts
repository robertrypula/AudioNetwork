// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { IListFactory } from './../../common';
import { IComplexFactory } from './../complex/complex-factory.interface';
import { IComplex } from './../complex/complex.interface';
import { ISignal, ISignalDto } from './signal.interface';

interface ISignalFactory {
  create(maxSize: number): ISignal;
  createFromArray(complexArray: IComplex[], maxSize?: number): ISignal;

  fromDto(complexListDto: ISignalDto): ISignal;  // TODO rename me
  fromRawIQ(rawIQ: number[]): ISignal;  // TODO rename me
  toDto(complexList: ISignal): ISignalDto;  // TODO refactor me - move to Signal class
  toRawIQ(complexList: ISignal): number[];  // TODO refactor me - move to Signal class
  isEqual(a: ISignal, b: ISignal): boolean;  // TODO refactor me - move to Signal class
}

interface ISignalFactoryStatic {
  new(
    complexFactory: IComplexFactory,
    listFactory: IListFactory
  ): ISignalFactory;
}

export {
  ISignalFactory,
  ISignalFactoryStatic
};
