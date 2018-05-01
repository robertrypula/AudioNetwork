// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { Injector } from 'rr-tsdi';

import { SIMPLE_MATH } from './../../common';
import { COMPLEX_FACTORY } from './di-token';

import { precisionDigits } from '../../settings';
import { SimpleMath } from './../../common';
import { Complex } from './complex';
import { ComplexFactory } from './complex-factory';
import { IComplexDto } from './complex.interface';

describe('ComplexFactory', () => {
  let complexFactory: ComplexFactory;

  beforeEach(() => {
    const injector = new Injector();

    injector.registerService(SIMPLE_MATH, SimpleMath);
    injector.registerService(COMPLEX_FACTORY, ComplexFactory);
    complexFactory = injector.get(COMPLEX_FACTORY);
  });

  it('should create proper instance', () => {
    expect(complexFactory).toBeInstanceOf(ComplexFactory);
  });

  it('should create instance of Complex class with default parameters', () => {
    const complex: Complex = complexFactory.create();

    expect(complex).toBeInstanceOf(Complex);
    expect(complex.getReal()).toBe(0);
    expect(complex.getImaginary()).toBe(0);
  });

  it('should create instance of Complex class basing on real/imaginary parameters', () => {
    const REAL = 12;
    const IMAGINARY = -32;
    const complex: Complex = complexFactory.create(REAL, IMAGINARY);

    expect(complex).toBeInstanceOf(Complex);
    expect(complex.getReal()).toBe(REAL);
    expect(complex.getImaginary()).toBe(IMAGINARY);
  });

  it('should create instance of Complex class basing on polar parameters', () => {
    let complex: Complex;

    complex = complexFactory.createPolar(0.125, 2);
    expect(complex).toBeInstanceOf(Complex);
    expect(complex.getReal()).toBeCloseTo(1.414214, precisionDigits);
    expect(complex.getImaginary()).toBeCloseTo(1.414214, precisionDigits);

    complex = complexFactory.createPolar(0.125);
    expect(complex).toBeInstanceOf(Complex);
    expect(complex.getReal()).toBeCloseTo(1.414214 / 2, precisionDigits);
    expect(complex.getImaginary()).toBeCloseTo(1.414214 / 2, precisionDigits);

    complex = complexFactory.createPolar();
    expect(complex).toBeInstanceOf(Complex);
    expect(complex.getReal()).toBeCloseTo(1, precisionDigits);
    expect(complex.getImaginary()).toBeCloseTo(0, precisionDigits);
  });

  it('should create instance of Complex class basing on dto', () => {
    const dto: IComplexDto = { real: 12, imaginary: -32 };
    const complex: Complex = complexFactory.createFromDto(dto);

    expect(complex).toBeInstanceOf(Complex);
    expect(complex.getReal()).toBe(dto.real);
    expect(complex.getImaginary()).toBe(dto.imaginary);
  });

  it('should create instance of Complex class basing on raw IQ data', () => {
    const rawIQ: number[] = [12, -32];
    let complex: Complex = complexFactory.createFromRawIQ(rawIQ);

    expect(complex).toBeInstanceOf(Complex);
    expect(complex.getReal()).toBe(rawIQ[0]);
    expect(complex.getImaginary()).toBe(rawIQ[1]);

    expect(() => {
      complex = complexFactory.createFromRawIQ([]);
    }).toThrow();

    expect(() => {
      complex = complexFactory.createFromRawIQ([1, 2, 3]);
    }).toThrow();
  });
});
