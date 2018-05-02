// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { IList, IListStatic } from './../../common';
import { IComplex } from './../complex/complex.interface';

interface ISignal extends IList<IComplex> {
  dropRealPart(): ISignal;
  dropImaginaryPart(): ISignal;
}

interface ISignalStatic extends IListStatic<IComplex> {
}

export {
  ISignal,
  ISignalStatic
};
