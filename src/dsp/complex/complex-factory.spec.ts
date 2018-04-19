// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { Injector } from 'rr-tsdi';

import { SIMPLE_MATH } from '../../common/simple-math/di-token';
import SimpleMath from '../../common/simple-math/simple-math';
import Complex from './complex';
import ComplexFactory from './complex-factory';
import { IComplexDto } from './complex.interface';
import { COMPLEX_FACTORY } from './di-token';

describe('ComplexFactory', () => {
  const NUMBER_OF_DIGITS = 6;
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
    expect(complex.getReal()).toBeCloseTo(1.414214, NUMBER_OF_DIGITS);
    expect(complex.getImaginary()).toBeCloseTo(1.414214, NUMBER_OF_DIGITS);
  });

  it('should create instance of Complex class basing on dto', () => {
    const dto: IComplexDto = { real: 12, imaginary: -32 };
    const complex: Complex = complexFactory.createFromDto(dto);

    expect(complex).toBeInstanceOf(Complex);
    expect(complex.getReal()).toBe(dto.real);
    expect(complex.getImaginary()).toBe(dto.imaginary);
  });
});
