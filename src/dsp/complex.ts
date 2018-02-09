// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { IComplex } from './complex.interface';

class Complex implements IComplex {
  private real: number;
  private imaginary: number;

  constructor(real: number, imaginary: number) {
    this.real = real;
    this.imaginary = imaginary;
  }

  /*
  Complex.$$_EPSILON = 0.000001;
  Complex.$$_UNIT_RADIUS = 1;

  Complex.prototype.clone = function () {
      return new Complex(
          this.$$real,
          this.$$imag
      );
  };

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

  Complex.prototype.swap = function () {
      var tmp = this.$$real;

      this.$$real = this.$$imag;
      this.$$imag = tmp;

      return this;
  };

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

  Complex.prototype.conjugate = function () {
      this.$$imag *= -1;

      return this;
  };

  Complex.prototype.multiplyScalar = function (b) {
      this.$$real *= b;
      this.$$imag *= b;

      return this;
  };

  Complex.prototype.divideScalar = function (b) {
      this.$$real /= b;
      this.$$imag /= b;

      return this;
  };
  */

  public getReal(): number {
    return this.real;
  }

  public getImaginary(): number {
    return this.imaginary;
  }

  /*
  Complex.prototype.getMagnitude = function () {
      return Math.sqrt(
          this.$$real * this.$$real +
          this.$$imag * this.$$imag
      );
  };

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

  Complex.prototype.normalize = function () {
      this.divideScalar(
          this.getMagnitude()
      );

      return this;
  };
  */
}

export default Complex;
