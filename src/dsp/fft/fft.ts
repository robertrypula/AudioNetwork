// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { staticImplements } from 'rr-tsdi';

import { IComplexFactory } from '../complex/complex-factory.interface';
import { IComplex } from '../complex/complex.interface';
import { COMPLEX_FACTORY } from '../complex/di-token';
import { IFft, IFftStatic } from './fft.interface';

@staticImplements<IFftStatic>()
class Fft implements IFft {
  public static $inject: string[] = [
    COMPLEX_FACTORY
  ];

  constructor(
    private complexFactory: IComplexFactory
  ) {
  }

  public forward(input: IComplex[]): IComplex[] {
    const n = input.length;
    let nHalf: number;
    let even: IComplex[];
    let odd: IComplex[];
    const output: IComplex[] = [];
    let wnkMultiplied: IComplex;
    let wnk: IComplex;
    let k: number;
    let unitAngle: number;

    if (n === 1) {
      return input;
    }

    // even and odd parts
    even = this.forward(this.getHalf(input, 0));
    odd = this.forward(this.getHalf(input, 1));

    // combine
    output.length = n;
    nHalf = n / 2;
    for (k = 0; k < nHalf; k++) {
      unitAngle = -k / n;
      wnk = this.complexFactory.createPolar(unitAngle);
      wnkMultiplied = wnk.clone().multiply(odd[k]);
      output[k] = even[k].clone().add(wnkMultiplied);
      output[nHalf + k] = even[k].clone().subtract(wnkMultiplied);
    }

    return output;
  }

  public inverse(input: IComplex[]): IComplex[] {
    let output: IComplex[] = [];
    let i: number;

    for (i = 0; i < input.length; i++) {
      output.push(input[i].clone().swap());
    }
    output = this.forward(output);
    for (i = 0; i < output.length; i++) {
      output[i].swap().divideScalar(output.length);
    }

    return output;
  }

  private getHalf(list: IComplex[], offset: number): IComplex[] {
    const listHalf: IComplex[] = [];
    const lengthHalf: number = list.length / 2;
    let item: IComplex;
    let i: number;

    for (i = 0; i < lengthHalf; i++) {
      item = list[i * 2 + offset];
      listHalf.push(item);
    }

    return listHalf;
  }

}

export default Fft;
