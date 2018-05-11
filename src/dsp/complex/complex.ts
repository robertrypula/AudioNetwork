// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { staticImplements } from 'rr-tsdi';

import { ISimpleMath } from './../../common/simple-math/simple-math.interface';
import { IComplexDependencyBag } from './complex-dependency-bag.interface';
import { IComplex, IComplexDto, IComplexStatic } from './complex.interface';

@staticImplements<IComplexStatic>()
export class Complex implements IComplex {
  // All Complex class dependencies stored in one
  // variable in order to save space in RAM
  constructor(
    protected complexDependencyBag: IComplexDependencyBag,
    protected real: number,
    protected imaginary: number
  ) {
  }

  public clone(): Complex {
    return new Complex(
      this.complexDependencyBag,
      this.real,
      this.imaginary
    );
  }

  public swap(): Complex {
    const tmp: number = this.real;

    this.real = this.imaginary;
    this.imaginary = tmp;

    return this;
  }

  public add(x: Complex): Complex {
    this.real += x.real;
    this.imaginary += x.imaginary;

    return this;
  }

  public subtract(x: Complex): Complex {
    this.real -= x.real;
    this.imaginary -= x.imaginary;

    return this;
  }

  public multiply(x: Complex): Complex {
    const real = this.real * x.real - this.imaginary * x.imaginary;
    const imaginary = this.real * x.imaginary + this.imaginary * x.real;

    this.real = real;
    this.imaginary = imaginary;

    return this;
  }

  public conjugate(): Complex {
    this.imaginary *= -1;

    return this;
  }

  public multiplyScalar(x: number): Complex {
    this.real *= x;
    this.imaginary *= x;

    return this;
  }

  public divideScalar(x: number): Complex {
    this.real /= x;
    this.imaginary /= x;

    return this;
  }

  public getReal(): number {
    return this.real;
  }

  public getImaginary(): number {
    return this.imaginary;
  }

  public getMagnitude(): number {
    const simpleMath: ISimpleMath = this.complexDependencyBag.simpleMath;

    return simpleMath.sqrt(
      simpleMath.pow(this.real, 2) + simpleMath.pow(this.imaginary, 2)
    );
  }

  public getUnitAngle(): number {
    const simpleMath: ISimpleMath = this.complexDependencyBag.simpleMath;
    const MAGNITUDE_LIMIT = 0.0000001;
    const x = this.real;
    const y = this.imaginary;
    const quarter = (y >= 0)
      ? (x >= 0 ? 1 : 2)
      : (x <= 0 ? 3 : 4);
    let magnitude = this.getMagnitude();
    let angle;
    let unitAngle;

    // prevents from dividing by zero
    magnitude = magnitude < MAGNITUDE_LIMIT
      ? MAGNITUDE_LIMIT
      : magnitude;

    //         ^             Legend:
    //  II     *     I        '!' = 0 degrees
    //         |              '*' = 90 degrees
    //  ----@--+--!---->      '@' = 180 degrees
    //         |              '%' = 270 degrees
    //  III    %     IV

    switch (quarter) {
      case 1:
        angle = simpleMath.asin(y / magnitude);
        break;
      case 2:
        angle = simpleMath.asin(-x / magnitude) + 0.5 * simpleMath.getPi();
        break;
      case 3:
        angle = simpleMath.asin(-y / magnitude) + simpleMath.getPi();
        break;
      case 4:
        angle = simpleMath.asin(x / magnitude) + 1.5 * simpleMath.getPi();
        break;
    }

    unitAngle = angle / (2 * simpleMath.getPi());

    return unitAngle;
  }

  public normalize(): Complex {
    this.divideScalar(
      this.getMagnitude()
    );

    return this;
  }

  public isEqualTo(b: IComplex): boolean {
    const simpleMath: ISimpleMath = this.complexDependencyBag.simpleMath;
    const epsilon: number = this.complexDependencyBag.epsilon;

    return (simpleMath.abs(this.real - b.getReal()) < epsilon) &&
      (simpleMath.abs(this.imaginary - b.getImaginary()) < epsilon);
  }

  public toDto(): IComplexDto {
    /* tslint:disable:object-literal-sort-keys */
    return {
      real: this.real,
      imaginary: this.imaginary
    };
    /* tslint:enable:object-literal-sort-keys */
  }

  public toRawIQ(): number[] {
    return [
      this.real,
      this.imaginary
    ];
  }
}
