// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { staticImplements } from 'rr-tsdi';

import { COMPLEX_FACTORY } from './../../complex/di-token';
import { SIGNAL_FACTORY } from './../../signal/di-token';

import { IComplexFactory } from './../../complex/complex-factory.interface';
import { IComplex } from './../../complex/complex.interface';
import { ISignalFactory } from './../../signal/signal-factory.interface';
import { ISignal } from './../../signal/signal.interface';
import { IFourierTransform, IFourierTransformStatic } from './../fourier-transform.interface';

/*
  One of the simplest forms of FFT implementation
  (recursive, decimation in time)

  NOTE: this implementation is not efficient - the goal
  was to just keep it clean and simple
*/

@staticImplements<IFourierTransformStatic>()
export class FftDitRecursive implements IFourierTransform {
  public static $inject: string[] = [
    SIGNAL_FACTORY,
    COMPLEX_FACTORY
  ];

  constructor(
    protected signalFactory: ISignalFactory,
    protected complexFactory: IComplexFactory
  ) {
  }

  public forward(input: ISignal): ISignal {
    const n: number = input.getSize();
    let nHalf: number;
    let even: ISignal;
    let odd: ISignal;
    let output: ISignal;
    let wnkMultiplied: IComplex;
    let wnk: IComplex;
    let k: number;
    let unitAngle: number;

    // TODO powers of 2 only - missing check

    if (n === 1) {
      return input;
    }

    // even and odd parts
    even = this.forward(input.filter((value: IComplex, index: number) => index % 2 === 0));
    odd = this.forward(input.filter((value: IComplex, index: number) => index % 2 === 1));

    // combine
    nHalf = n / 2;
    output = this.signalFactory
      .create(n)
      .fillWith(undefined);

    for (k = 0; k < nHalf; k++) {
      unitAngle = -k / n;
      wnk = this.complexFactory.createPolar(unitAngle);
      wnkMultiplied = wnk.clone().multiply(odd.getAt(k));     // <--- clone() probably not required
      output.setAt(k, even.getAt(k).clone().add(wnkMultiplied));
      output.setAt(nHalf + k, even.getAt(k).clone().subtract(wnkMultiplied));
    }

    return output;
  }

  public inverse(input: ISignal): ISignal {
    let output: ISignal = this.signalFactory.create(input.getSize());

    input.forEach((value: IComplex) => {
      output.append(value.clone().swap());
    });
    output = this.forward(output);
    output.forEach((value: IComplex) => {
      value.swap().divideScalar(output.getSize());
    });

    return output;
  }
}
