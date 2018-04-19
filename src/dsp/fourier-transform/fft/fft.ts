// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { staticImplements } from 'rr-tsdi';

import { LIST_FACTORY } from '../../../common/list/di-token';
import { IListFactory } from '../../../common/list/list-factory.interface';
import { IList } from '../../../common/list/list.interface';
import { IComplexFactory } from '../../complex/complex-factory.interface';
import { IComplex } from '../../complex/complex.interface';
import { COMPLEX_FACTORY } from '../../complex/di-token';
import { IFourierTransform, IFourierTransformStatic } from './../fourier-transform.interface';

@staticImplements<IFourierTransformStatic>()
class Fft implements IFourierTransform {
  public static $inject: string[] = [
    LIST_FACTORY,
    COMPLEX_FACTORY
  ];

  constructor(
    protected listFactory: IListFactory,
    protected complexFactory: IComplexFactory
  ) {
  }

  public forward(input: IList<IComplex>): IList<IComplex> {
    const n: number = input.getSize();
    let nHalf: number;
    let even: IList<IComplex>;
    let odd: IList<IComplex>;
    let output: IList<IComplex>;
    let wnkMultiplied: IComplex;
    let wnk: IComplex;
    let k: number;
    let unitAngle: number;

    if (n === 1) {
      return input;
    }

    // even and odd parts
    even = this.forward(input.filter((value: IComplex, index: number) => index % 2 === 0));
    odd = this.forward(input.filter((value: IComplex, index: number) => index % 2 === 1));

    // combine
    nHalf = n / 2;
    output = this.listFactory
      .create<IComplex>(n)
      .fillWith(undefined);
    for (k = 0; k < nHalf; k++) {
      unitAngle = -k / n;
      wnk = this.complexFactory.createPolar(unitAngle);
      wnkMultiplied = wnk.clone().multiply(odd.getAt(k));
      output.setAt(k, even.getAt(k).clone().add(wnkMultiplied));
      output.setAt(nHalf + k, even.getAt(k).clone().subtract(wnkMultiplied));
    }

    return output;
  }

  public inverse(input: IList<IComplex>): IList<IComplex> {
    return input;
    /*
    let output: IList<IComplex> = [];
    let i: number;

    for (i = 0; i < input.length; i++) {
      output.push(input[i].clone().swap());
    }
    output = this.forward(output);
    for (i = 0; i < output.length; i++) {
      output[i].swap().divideScalar(output.length);
    }

    return output;
    */
  }
}

export default Fft;
