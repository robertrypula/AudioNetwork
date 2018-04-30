// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { Injector } from 'rr-tsdi';

import { SIMPLE_MATH } from './di-token';

import { precisionDigits } from './../../settings';
import SimpleMath from './simple-math';
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
});
