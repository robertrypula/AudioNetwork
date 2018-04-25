// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { staticImplements } from 'rr-tsdi';

import { SIMPLE_MATH } from './../../common';

import { ISimpleMath } from './../../common';
import Complex from './complex';
import { IComplexFactory, IComplexFactoryStatic } from './complex-factory.interface';
import { IComplexDto } from './complex.interface';

@staticImplements<IComplexFactoryStatic>()
class ComplexFactory implements IComplexFactory {
  public static $inject: string[] = [
    SIMPLE_MATH
  ];

  constructor(
    protected simpleMath: ISimpleMath
  ) {
  }

  public create(real: number = 0, imaginary: number = 0): Complex {
    return new Complex(
      this.simpleMath,
      real,
      imaginary
    );
  }

  public createPolar(unitAngle: number = 0, magnitude: number = 1): Complex {
    const radian: number = 2 * this.simpleMath.getPi() * unitAngle;

    return this.create(
      magnitude * this.simpleMath.cos(radian),
      magnitude * this.simpleMath.sin(radian)
    );
  }

  public createFromDto(complexDto: IComplexDto): Complex {
    return new Complex(
      this.simpleMath,
      complexDto.real,
      complexDto.imaginary
    );
  }
}

export default ComplexFactory;
