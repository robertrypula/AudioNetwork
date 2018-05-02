// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { IListFactory } from './../../common';
import { IComplexFactory } from './../complex/complex-factory.interface';
import { IComplex } from './../complex/complex.interface';
import { ISignal, ISignalDto } from './signal.interface';

interface ISignalFactory {
  create(sizeMax: number): ISignal;
  createFromComplexArray(complexArray: IComplex[], sizeMax?: number): ISignal;
  createFromDto(signalDto: ISignalDto): ISignal;
  createFromRawIQ(rawIQ: number[]): ISignal;
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
