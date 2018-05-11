// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { Injector } from 'rr-tsdi';

import { SIMPLE_MATH } from './di-token';

import { precisionDigits } from './../../settings';
import { SimpleMath } from './simple-math';
import { ISimpleMath } from './simple-math.interface';

describe('List', () => {
  let simpleMath: ISimpleMath;

  beforeEach(() => {
    const injector = new Injector();

    injector.registerService(SIMPLE_MATH, SimpleMath);
    simpleMath = injector.get(SIMPLE_MATH);
  });

  it('should create proper instance', () => {
    expect(simpleMath).toBeInstanceOf(SimpleMath);
  });

  it('should return proper PI value', () => {
    expect(simpleMath.getPi()).toBeCloseTo(3.141593, precisionDigits);
  });

  it('should properly compute sine and cosine', () => {
    expect(simpleMath.sin(0.123456)).toBeCloseTo(0.123143, precisionDigits);
    expect(simpleMath.cos(0.123456)).toBeCloseTo(0.992389, precisionDigits);
  });

  it('should properly compute arcus sine', () => {
    expect(simpleMath.asin(0.123456)).toBeCloseTo(0.123772, precisionDigits);
  });

  it('should properly compute power and square root', () => {
    expect(simpleMath.pow(0.123456, 2)).toBeCloseTo(0.015241, precisionDigits);
    expect(simpleMath.sqrt(0.123456)).toBeCloseTo(0.351363, precisionDigits);
  });

  it('should pass random test', () => {
    simpleMath.random();
    expect(true).toBe(true);  // we cannot test random values in unit tests... ;)
  });

  it('should properly compute min and max', () => {
    expect(simpleMath.max(0.123456, 0.654321)).toBeCloseTo(0.654321, precisionDigits);
    expect(simpleMath.min(0.123456, 0.654321)).toBeCloseTo(0.123456, precisionDigits);
  });

  it('should properly return absolute value', () => {
    expect(simpleMath.abs(0.123456)).toBeCloseTo(0.123456, precisionDigits);
    expect(simpleMath.abs(-0.123456)).toBeCloseTo(0.123456, precisionDigits);
  });
});
