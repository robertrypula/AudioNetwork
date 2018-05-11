// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { Injector } from 'rr-tsdi';

import { SIMPLE_MATH } from './../../common';
import { PRECISION_DIGITS } from './../../di-token';
import { COMPLEX_DEPENDENCY_BAG } from './di-token';

import { SimpleMath } from './../../common';
import { precisionDigits } from './../../settings';
import { ComplexDependencyBag } from './complex-dependency-bag';
import { IComplexDependencyBag } from './complex-dependency-bag.interface';

describe('ComplexDependencyBag', () => {
  it('should properly provide all expected items', () => {
    const injector = new Injector();
    let complexDependencyBag: IComplexDependencyBag;

    injector.registerService(SIMPLE_MATH, SimpleMath);
    injector.registerValue(PRECISION_DIGITS, precisionDigits);
    injector.registerService(COMPLEX_DEPENDENCY_BAG, ComplexDependencyBag);

    complexDependencyBag = injector.get(COMPLEX_DEPENDENCY_BAG);

    expect(complexDependencyBag).toBeInstanceOf(ComplexDependencyBag);
    expect(complexDependencyBag.simpleMath).toBeInstanceOf(SimpleMath);
    expect(complexDependencyBag.precisionDigits).toBe(precisionDigits);
    expect(complexDependencyBag.epsilon).toBe(0.000001);
  });
});
