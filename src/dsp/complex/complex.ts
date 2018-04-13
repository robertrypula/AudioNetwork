// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { ISimpleMath } from './../../common/simple-math/simple-math.interface';
import { IComplex } from './complex.interface';

class Complex implements IComplex {
  // TODO probably it's bad to have reference to 'simpleMath'
  // in each Complex object but it's how DI works...
  constructor(
    private simpleMath: ISimpleMath,
    private real: number,
    private imaginary: number
  ) {
  }

  public clone(): Complex {
    return new Complex(this.simpleMath, this.real, this.imaginary);
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
    return this.simpleMath.sqrt(
      this.simpleMath.pow(this.real, 2) + this.simpleMath.pow(this.imaginary, 2)
    );
  }

  public getUnitAngle(): number {
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
        angle = this.simpleMath.asin(y / magnitude);
        break;
      case 2:
        angle = this.simpleMath.asin(-x / magnitude) + 0.5 * this.simpleMath.getPi();
        break;
      case 3:
        angle = this.simpleMath.asin(-y / magnitude) + this.simpleMath.getPi();
        break;
      case 4:
        angle = this.simpleMath.asin(x / magnitude) + 1.5 * this.simpleMath.getPi();
        break;
    }

    unitAngle = angle / (2 * this.simpleMath.getPi());

    return unitAngle;
  }

  public normalize(): Complex {
    this.divideScalar(
      this.getMagnitude()
    );

    return this;
  }
}

export default Complex;
