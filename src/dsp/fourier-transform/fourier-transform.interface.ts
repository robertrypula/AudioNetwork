// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { IComplexFactory } from './../complex/complex-factory.interface';
import { ISignalFactory } from './../signal/signal-factory.interface';
import { ISignal, ISignalDto } from './../signal/signal.interface';

interface IFourierTransform {
  forward(input: ISignal): ISignal;
  inverse(input: ISignal): ISignal;
}

interface IFourierTransformStatic {
  new(
    signalFactory: ISignalFactory,
    complexFactory: IComplexFactory
  ): IFourierTransform;
}

interface IFourierTransformTestCase {
  input: ISignalDto;
  output: ISignalDto;
}

export {
  IFourierTransform,
  IFourierTransformStatic,
  IFourierTransformTestCase
};
