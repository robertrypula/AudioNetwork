// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { ISimpleMath } from '../common/simple-math/simple-math.interface';
import { IComplex } from './complex.interface';

class Complex implements IComplex {
  private simpleMath: ISimpleMath;
  private real: number;
  private imaginary: number;

  constructor(simpleMath: ISimpleMath, real: number, imaginary: number) {
    this.simpleMath = simpleMath; // TODO this is bad to have reference in every instance...
    this.real = real;
    this.imaginary = imaginary;
  }

  // Complex.$$_EPSILON = 0.000001;
  // Complex.$$_UNIT_RADIUS = 1;

  public clone(): Complex {
    return new Complex(this.simpleMath, this.real, this.imaginary);
  }

  /*
  Complex.polar = function (unitAngle, magnitude) {
      var radian;

      magnitude = typeof magnitude === 'undefined'
          ? Complex.$$_UNIT_RADIUS
          : magnitude;

      radian = 2 * Math.PI * unitAngle;

      return new Complex(
          magnitude * Math.cos(radian),
          magnitude * Math.sin(radian)
      );
  };

  Complex.zero = function () {
      return new Complex(0, 0);
  };
  */

  public swap(): Complex {
    const tmp: number = this.real;

    this.real = this.imaginary;
    this.imaginary = tmp;

    return this;
  }

  /*
  Complex.prototype.add = function (b) {
      this.$$real += b.$$real;
      this.$$imag += b.$$imag;

      return this;
  };

  Complex.prototype.subtract = function (b) {
      this.$$real -= b.$$real;
      this.$$imag -= b.$$imag;

      return this;
  };

  Complex.prototype.multiply = function (b) {
      var
          real = this.$$real * b.$$real - this.$$imag * b.$$imag,
          imag = this.$$real * b.$$imag + this.$$imag * b.$$real;

      this.$$real = real;
      this.$$imag = imag;

      return this;
  };
  */

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
  /*

  Complex.prototype.getUnitAngle = function () {
      var x, y, magnitude, quarter, angle, unitAngle;

      x = this.$$real;
      y = this.$$imag;
      magnitude = this.getMagnitude();
      magnitude = magnitude < Complex.$$_EPSILON  // prevents from dividing by zero
          ? Complex.$$_EPSILON
          : magnitude;

      //         ^             Legend:
      //  II     *     I        '!' = 0 degrees
      //         |              '*' = 90 degrees
      //  ----@--+--!---->      '@' = 180 degrees
      //         |              '%' = 270 degrees
      //  III    %     IV

      quarter = (y >= 0)
          ? (x >= 0 ? 1 : 2)
          : (x <= 0 ? 3 : 4);

      switch (quarter) {
          case 1:
              angle = Math.asin(y / magnitude);
              break;
          case 2:
              angle = Math.asin(-x / magnitude) + 0.5 * Math.PI;
              break;
          case 3:
              angle = Math.asin(-y / magnitude) + Math.PI;
              break;
          case 4:
              angle = Math.asin(x / magnitude) + 1.5 * Math.PI;
              break;
      }

      unitAngle = angle / (2 * Math.PI);

      return unitAngle;
  };
  */

  public normalize(): Complex {
    this.divideScalar(
      this.getMagnitude()
    );

    return this;
  }
}

export default Complex;
