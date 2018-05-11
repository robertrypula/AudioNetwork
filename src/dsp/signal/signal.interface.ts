// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { IList } from './../../common';
import { IComplex, IComplexDto } from './../complex/complex.interface';

type ISignalDto = IComplexDto[];

interface ISignal {
  // methods that should always follow IList<T> interface
  clone(): ISignal;
  getAt(position: number): IComplex;
  setAt(position: number, sample: IComplex): ISignal;
  append(sample: IComplex): ISignal;
  appendEvenIfFull(sample: IComplex): ISignal;
  appendArray(sampleArray: IComplex[]): ISignal;
  takeFirst(): IComplex;
  takeLast(): IComplex;
  fillWith(sample: IComplex, size?: number): ISignal;
  isFull(): boolean;
  isEmpty(): boolean;
  setSizeMax(sizeMax: number): ISignal;
  getSizeMax(): number;
  getSize(): number;
  forEach(callback: (sample: IComplex, index?: number) => void | boolean): ISignal;
  filter(callback: (sample: IComplex, index?: number) => boolean): ISignal;
  toArray(): IComplex[];

  // rest of the Signal class methods
  toDto(): ISignalDto;
  toRawIQ(): number[];
  isEqualTo(b: ISignal): boolean;
}

interface ISignalStatic {
  new(
    complexList: IList<IComplex>
  ): ISignal;
}

export {
  ISignalDto,
  ISignal,
  ISignalStatic
};
