// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { staticImplements } from 'rr-tsdi';

import { COMPLEX_DEPENDENCY_BAG } from './di-token';

import { GenericException, ISimpleMath } from './../../common';
import { Complex } from './complex';
import { IComplexDependencyBag } from './complex-dependency-bag.interface';
import { IComplexFactory, IComplexFactoryStatic } from './complex-factory.interface';
import { IComplexDto } from './complex.interface';

@staticImplements<IComplexFactoryStatic>()
export class ComplexFactory implements IComplexFactory {
  public static $inject: string[] = [
    COMPLEX_DEPENDENCY_BAG
  ];

  constructor(
    protected complexDependencyBag: IComplexDependencyBag
  ) {
  }

  public create(real: number = 0, imaginary: number = 0): Complex {
    return new Complex(
      this.complexDependencyBag,
      real,
      imaginary
    );
  }

  public createPolar(unitAngle: number = 0, magnitude: number = 1): Complex {
    const simpleMath: ISimpleMath = this.complexDependencyBag.simpleMath;
    const radian: number = 2 * simpleMath.getPi() * unitAngle;

    return this.create(
      magnitude * simpleMath.cos(radian),
      magnitude * simpleMath.sin(radian)
    );
  }

  public createFromDto(complexDto: IComplexDto): Complex {
    return new Complex(
      this.complexDependencyBag,
      complexDto.real,
      complexDto.imaginary
    );
  }

  public createFromRawIQ(rawIQ: number[]): Complex {
    if (rawIQ.length !== 2) {
      throw new GenericException(RAW_IQ_ARRAY_LENGTH_SHOULD_BE_EQUAL_TO_TWO);
    }

    return new Complex(
      this.complexDependencyBag,
      rawIQ[0],
      rawIQ[1]
    );
  }
}

const RAW_IQ_ARRAY_LENGTH_SHOULD_BE_EQUAL_TO_TWO = 'Raw IQ array should be equal to 2';
