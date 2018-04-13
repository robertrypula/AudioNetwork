// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { SIMPLE_MATH } from '../../common/simple-math/di-token';
import { ISimpleMath } from './../../common/simple-math/simple-math.interface';
import Complex from './complex';
import { IComplexFactory } from './complex-factory.interface';

class ComplexFactory implements IComplexFactory {
  public static $inject: string[] = [
    SIMPLE_MATH
  ];

  constructor(
    private simpleMath: ISimpleMath
  ) {
  }

  public create(real: number = 0, imaginary: number = 0): Complex {
    return new Complex(this.simpleMath, real, imaginary);
  }

  public createPolar(unitAngle: number = 0, magnitude: number = 1): Complex {
    const radian: number = 2 * this.simpleMath.getPi() * unitAngle;

    return this.create(
      magnitude * this.simpleMath.cos(radian),
      magnitude * this.simpleMath.sin(radian)
    );
  }
}

export default ComplexFactory;
