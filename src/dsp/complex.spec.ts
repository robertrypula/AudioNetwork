import SimpleMath from './../common/simple-math/simple-math';
import Complex from './complex';

describe('Complex', () => {
  const NUMBER_OF_DIGITS = 6;
  const REAL = 5;
  const IMAGINARY = -9;
  const REAL_NORMALIZED = 0.485643;
  const IMAGINARY_NORMALIZED = -0.874157;
  const EXPCTED_MAGNITUDE = 10.295630;
  let simpleMath: SimpleMath;
  let complex: Complex;

  beforeEach(() => {
    simpleMath = new SimpleMath();
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

    expect(complexMultiplied.getReal()).toBeCloseTo(REAL * MULTIPLY_SCALAR, NUMBER_OF_DIGITS);
    expect(complexMultiplied.getImaginary()).toBeCloseTo(IMAGINARY * MULTIPLY_SCALAR, NUMBER_OF_DIGITS);
    expect(complex).toBe(complexMultiplied);
  });

  it('should properly divide by scalar and return the same instance', () => {
    const DIVIDE_SCALAR: number = 5;
    const complexDivided: Complex = complex.divideScalar(DIVIDE_SCALAR);

    expect(complexDivided.getReal()).toBeCloseTo(REAL / DIVIDE_SCALAR, NUMBER_OF_DIGITS);
    expect(complexDivided.getImaginary()).toBeCloseTo(IMAGINARY / DIVIDE_SCALAR, NUMBER_OF_DIGITS);
    expect(complex).toBe(complexDivided);
  });

  it('should return real and imaginary part', () => {
    expect(complex.getReal()).toBe(REAL);
    expect(complex.getImaginary()).toBe(IMAGINARY);
  });

  it('should return proper magnitude', () => {
    const complexMagnitude: number = complex.getMagnitude();

    expect(complexMagnitude).toBeCloseTo(EXPCTED_MAGNITUDE, NUMBER_OF_DIGITS);
  });

  it('should normalize complex number and return the same instance', () => {
    const complexNormalized: Complex = complex.normalize();
    const UNIT = 1;

    expect(complexNormalized.getReal()).toBeCloseTo(REAL_NORMALIZED, NUMBER_OF_DIGITS);
    expect(complexNormalized.getImaginary()).toBeCloseTo(IMAGINARY_NORMALIZED, NUMBER_OF_DIGITS);
    expect(complexNormalized.getMagnitude()).toBeCloseTo(UNIT, NUMBER_OF_DIGITS);
    expect(complex).toBe(complexNormalized);
  });
});
