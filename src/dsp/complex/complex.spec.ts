// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { precisionDigits } from '../../settings';
import { SimpleMath } from './../../common';
import { Complex } from './complex';
import { IComplexDto } from './complex.interface';

describe('Complex', () => {
  const REAL = 5;
  const IMAGINARY = -9;
  const REAL_NORMALIZED = 0.485643;
  const IMAGINARY_NORMALIZED = -0.874157;
  const EXPCTED_MAGNITUDE = 10.295630;
  let simpleMath: SimpleMath;
  let complex: Complex;

  beforeEach(() => {
    simpleMath = new SimpleMath();       // TODO get simpleMath from DI
    complex = new Complex(simpleMath, REAL, IMAGINARY);
  });

  it('should create proper instance', () => {
    expect(complex).toBeInstanceOf(Complex);
  });

  it('should properly clone', () => {
    const complexCopy: Complex = complex.clone();

    expect(complex).not.toBe(complexCopy);
    expect(complex.getReal()).toBe(complexCopy.getReal());
    expect(complex.getImaginary()).toBe(complexCopy.getImaginary());
  });

  it('should swap the real and imaginary components and return the same instance', () => {
    const realPrevious: number = complex.getReal();
    const imaginaryPrevious: number = complex.getImaginary();
    const complexSwaped: Complex = complex.swap();

    expect(complexSwaped.getReal()).toBe(imaginaryPrevious);
    expect(complexSwaped.getImaginary()).toBe(realPrevious);
    expect(complex).toBe(complexSwaped);
  });

  it('should properly add two complex numers and return the same instance', () => {
    const REAL_TO_ADD: number = 32;
    const IMAGINARY_TO_ADD: number = -3;
    const complexB: Complex = new Complex(simpleMath, REAL_TO_ADD, IMAGINARY_TO_ADD);
    const complexSummed: Complex = complex.add(complexB);

    expect(complexSummed.getReal()).toBeCloseTo(REAL + REAL_TO_ADD, precisionDigits);
    expect(complexSummed.getImaginary()).toBeCloseTo(IMAGINARY + IMAGINARY_TO_ADD, precisionDigits);
    expect(complexSummed).toBe(complex);
  });

  it('should properly subtract two complex numers and return the same instance', () => {
    const REAL_TO_SUBTRACT: number = 32;
    const IMAGINARY_TO_SUBTRACT: number = -3;
    const complexB: Complex = new Complex(simpleMath, REAL_TO_SUBTRACT, IMAGINARY_TO_SUBTRACT);
    const complexSubtracted: Complex = complex.subtract(complexB);

    expect(complexSubtracted.getReal()).toBeCloseTo(REAL - REAL_TO_SUBTRACT, precisionDigits);
    expect(complexSubtracted.getImaginary()).toBeCloseTo(IMAGINARY - IMAGINARY_TO_SUBTRACT, precisionDigits);
    expect(complexSubtracted).toBe(complex);
  });

  it('should properly multiply two complex numers and return the same instance', () => {
    const REAL_TO_MULTIPLY: number = 32;
    const IMAGINARY_TO_MULTIPLY: number = -3;
    const complexB: Complex = new Complex(simpleMath, REAL_TO_MULTIPLY, IMAGINARY_TO_MULTIPLY);
    const complexMultiplied: Complex = complex.multiply(complexB);
    const REAL_EXPECTATION = REAL * REAL_TO_MULTIPLY - IMAGINARY * IMAGINARY_TO_MULTIPLY;
    const IMAGINARY_EXPECTATION = REAL * IMAGINARY_TO_MULTIPLY + IMAGINARY * REAL_TO_MULTIPLY;

    expect(complexMultiplied.getReal()).toBeCloseTo(REAL_EXPECTATION, precisionDigits);
    expect(complexMultiplied.getImaginary()).toBeCloseTo(IMAGINARY_EXPECTATION, precisionDigits);
    expect(complexMultiplied).toBe(complex);
  });

  it('should change the sign of imaginary component (conjugate) and return the same instance', () => {
    const realPrevious: number = complex.getReal();
    const imaginaryPrevious: number = complex.getImaginary();
    const complexConjugate: Complex = complex.conjugate();

    expect(complexConjugate.getReal()).toBe(realPrevious);
    expect(complexConjugate.getImaginary()).toBe(-imaginaryPrevious);
    expect(complex).toBe(complexConjugate);
  });

  it('should properly multiply by scalar and return the same instance', () => {
    const MULTIPLY_SCALAR: number = 5;
    const complexMultiplied: Complex = complex.multiplyScalar(MULTIPLY_SCALAR);

    expect(complexMultiplied.getReal()).toBeCloseTo(REAL * MULTIPLY_SCALAR, precisionDigits);
    expect(complexMultiplied.getImaginary()).toBeCloseTo(IMAGINARY * MULTIPLY_SCALAR, precisionDigits);
    expect(complex).toBe(complexMultiplied);
  });

  it('should properly divide by scalar and return the same instance', () => {
    const DIVIDE_SCALAR: number = 5;
    const complexDivided: Complex = complex.divideScalar(DIVIDE_SCALAR);

    expect(complexDivided.getReal()).toBeCloseTo(REAL / DIVIDE_SCALAR, precisionDigits);
    expect(complexDivided.getImaginary()).toBeCloseTo(IMAGINARY / DIVIDE_SCALAR, precisionDigits);
    expect(complex).toBe(complexDivided);
  });

  it('should return real and imaginary part', () => {
    expect(complex.getReal()).toBe(REAL);
    expect(complex.getImaginary()).toBe(IMAGINARY);
  });

  it('should return proper magnitude', () => {
    const complexMagnitude: number = complex.getMagnitude();

    expect(complexMagnitude).toBeCloseTo(EXPCTED_MAGNITUDE, precisionDigits);
  });

  it('should return unit angle between positive side of X axis and complex number point (counter-clockwise)', () => {
    let x: Complex;

    x = new Complex(simpleMath, 0.707107, 0.707106);
    expect(x.getUnitAngle()).toBeCloseTo(0.125, precisionDigits);

    x = new Complex(simpleMath, -0.707107, 0.707106);
    expect(x.getUnitAngle()).toBeCloseTo(0.25 + 0.125, precisionDigits);

    x = new Complex(simpleMath, -0.707107, -0.707106);
    expect(x.getUnitAngle()).toBeCloseTo(0.5 + 0.125, precisionDigits);

    x = new Complex(simpleMath, 0.707107, -0.707106);
    expect(x.getUnitAngle()).toBeCloseTo(0.75 + 0.125, precisionDigits);

    x = new Complex(simpleMath, 0.809017, 0.587785);
    expect(x.getUnitAngle()).toBeCloseTo(0.1, precisionDigits);

    x = new Complex(simpleMath, 0.999980, 0.006283);
    expect(x.getUnitAngle()).toBeCloseTo(0.001, precisionDigits);

    x = new Complex(simpleMath, -0.006283, 0.999980);
    expect(x.getUnitAngle()).toBeCloseTo(0.25 + 0.001, precisionDigits);

    x = new Complex(simpleMath, -0.999980, -0.006283);
    expect(x.getUnitAngle()).toBeCloseTo(0.5 + 0.001, precisionDigits);

    x = new Complex(simpleMath, 0.006283, -0.999980);
    expect(x.getUnitAngle()).toBeCloseTo(0.75 + 0.001, precisionDigits);
  });

  it('should not throw any error while trying to get unit angle when magnitude is zero', () => {
    let x: Complex;

    x = new Complex(simpleMath, 0, 0);
    expect(x.getUnitAngle()).toBeCloseTo(0, precisionDigits);
  });

  it('should normalize complex number and return the same instance', () => {
    const complexNormalized: Complex = complex.normalize();
    const UNIT = 1;

    expect(complexNormalized.getReal()).toBeCloseTo(REAL_NORMALIZED, precisionDigits);
    expect(complexNormalized.getImaginary()).toBeCloseTo(IMAGINARY_NORMALIZED, precisionDigits);
    expect(complexNormalized.getMagnitude()).toBeCloseTo(UNIT, precisionDigits);
    expect(complex).toBe(complexNormalized);
  });

  it('should properly return DTO', () => {
    const complexDto: IComplexDto = complex.toDto();

    expect(complexDto.real).toBe(complex.getReal());
    expect(complexDto.imaginary).toBe(complex.getImaginary());
  });
});
