// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { IComplexFactory } from '../complex/complex-factory.interface';
import { IComplex } from '../complex/complex.interface';
import { COMPLEX_FACTORY } from '../complex/di-token';

class Fft {
  public static $inject: string[] = [
    COMPLEX_FACTORY
  ];

  constructor(
    private complexFactory: IComplexFactory
  ) {
  }

  /*
  Fft.forward = function (input) {
    var
      n = input.length,
      nHalf,
      even,
      odd,
      output = [],
      wnkMultiplied,
      wnk,
      k,
      unitAngle;

    if (n === 1) {
      return input;
    }

    // even and odd parts
    even = Fft.forward(Fft.$$getHalf(input, 0));
    odd = Fft.forward(Fft.$$getHalf(input, 1));

    // combine
    output.length = n;
    nHalf = n / 2;
    for (k = 0; k < nHalf; k++) {
      unitAngle = -k / n;
      wnk = Complex.polar(unitAngle);
      wnkMultiplied = wnk.clone().multiply(odd[k]);
      output[k] = even[k].clone().add(wnkMultiplied);
      output[nHalf + k] = even[k].clone().subtract(wnkMultiplied);
    }

    return output;
  };

  Fft.inverse = function (input) {
    var
      output = [],
      i;

    for (i = 0; i < input.length; i++) {
      output.push(input[i].clone().swap());
    }
    output = Fft.forward(output);
    for (i = 0; i < output.length; i++) {
      output[i].swap().divideScalar(output.length);
    }

    return output;
  };
  */

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
