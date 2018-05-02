// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { Injector } from 'rr-tsdi';

import { PRECISION_DIGITS } from '../../di-token';
import { LIST_FACTORY, SIMPLE_MATH } from './../../common';
import { COMPLEX_DEPENDENCY_BAG, COMPLEX_FACTORY } from './../complex/di-token';
import { SIGNAL_FACTORY } from './di-token';

import { precisionDigits } from '../../settings';
import { ListFactory, SimpleMath } from './../../common';
import { ComplexDependencyBag } from './../complex/complex-dependency-bag';
import { ComplexFactory } from './../complex/complex-factory';
import { IComplexFactory } from './../complex/complex-factory.interface';
import { SignalFactory } from './signal-factory';
import { ISignalFactory } from './signal-factory.interface';
import { ISignal, ISignalDto } from './signal.interface';

describe('Signal', () => {
  let signalFactory: ISignalFactory;
  let complexFactory: IComplexFactory;

  beforeEach(() => {
    const injector = new Injector();

    injector.registerService(COMPLEX_DEPENDENCY_BAG, ComplexDependencyBag);
    injector.registerValue(PRECISION_DIGITS, precisionDigits);
    injector.registerService(COMPLEX_FACTORY, ComplexFactory);
    injector.registerService(SIMPLE_MATH, SimpleMath);
    injector.registerService(LIST_FACTORY, ListFactory);
    injector.registerService(SIGNAL_FACTORY, SignalFactory);

    signalFactory = injector.get(SIGNAL_FACTORY);
    complexFactory = injector.get(COMPLEX_FACTORY);
  });

  it('should convert signal into Signal DTO', () => {
    const signal: ISignal = signalFactory.create(2);
    let signalDto: ISignalDto;

    signal.append(complexFactory.create(1, 2));
    signal.append(complexFactory.create(3, 4));

    signalDto = signal.toDto();

    expect(signalDto).toEqual(
      [
        { real: 1, imaginary: 2 },
        { real: 3, imaginary: 4 }
      ]
    );
  });

  it('should convert signal into raw IQ data', () => {
    const signal: ISignal = signalFactory.create(2);
    let rawIQ: number[];

    signal.append(complexFactory.create(1, 2));
    signal.append(complexFactory.create(3, 4));

    rawIQ = signal.toRawIQ();

    expect(rawIQ).toEqual([1, 2, 3, 4]);
  });

  it('should properly indicate that lists are equal', () => {
    const a = signalFactory.createFromRawIQ([1, 2, 3, 4.000000]);
    const b = signalFactory.createFromRawIQ([1, 2, 3, 4.000000]);
    const c = signalFactory.createFromRawIQ([1, 2, 3, 4.0000001]);
    const d = signalFactory.createFromRawIQ([1, 2, 3, 4.000001]);
    const e = signalFactory.createFromRawIQ([1, 2]);
    const emptyA = signalFactory.createFromRawIQ([]);
    const emptyB = signalFactory.createFromRawIQ([]);

    expect(a.isEqualTo(b)).toBe(true);
    expect(a.isEqualTo(c)).toBe(true);
    expect(a.isEqualTo(d)).toBe(false);
    expect(a.isEqualTo(e)).toBe(false);
    expect(emptyA.isEqualTo(emptyB)).toBe(true);
  });
});
