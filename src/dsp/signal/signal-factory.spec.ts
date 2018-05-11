// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { Injector } from 'rr-tsdi';

import { LIST_FACTORY, SIMPLE_MATH } from './../../common';
import { PRECISION_DIGITS } from './../../di-token';
import { COMPLEX_DEPENDENCY_BAG, COMPLEX_FACTORY } from './../complex/di-token';
import { SIGNAL_FACTORY } from './di-token';

import { ListFactory, SimpleMath } from './../../common';
import { precisionDigits } from './../../settings';
import { ComplexDependencyBag } from './../complex/complex-dependency-bag';
import { ComplexFactory } from './../complex/complex-factory';
import { IComplexFactory } from './../complex/complex-factory.interface';
import { IComplex } from './../complex/complex.interface';
import { ISignalFactory } from './../signal/signal-factory.interface';
import { ISignal, ISignalDto } from './../signal/signal.interface';
import { SignalFactory } from './signal-factory';

describe('SignalFactory', () => {
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

  it('should create proper instance', () => {
    expect(signalFactory).toBeInstanceOf(SignalFactory);
  });

  it('should create signal instance from Complex array and respect provided size max', () => {
    const complexArray: IComplex[] = [
      complexFactory.create(1, 2),
      complexFactory.create(3, 4)
    ];
    let signal: ISignal;

    signal = signalFactory.createFromComplexArray(complexArray);
    expect(signal.getSize()).toBe(2);
    expect(signal.getAt(0).isEqualTo(complexArray[0])).toBe(true);
    expect(signal.getAt(1).isEqualTo(complexArray[1])).toBe(true);

    signal = signalFactory.createFromComplexArray(complexArray, 1);
    expect(signal.getSize()).toBe(1);
    expect(signal.getAt(0).isEqualTo(complexArray[1])).toBe(true); // <-- NOTE: on getAt(0) we have LAST item

    signal = signalFactory.createFromComplexArray(complexArray, 3);
    expect(signal.getSize()).toBe(2);
    expect(signal.getSizeMax()).toBe(3);
    expect(signal.getAt(0).isEqualTo(complexArray[0])).toBe(true);
    expect(signal.getAt(1).isEqualTo(complexArray[1])).toBe(true);
    expect(() => {
      signal.getAt(2);
    }).toThrow();
  });

  it('should create signal instance from Signal DTO', () => {
    const signalDto: ISignalDto = [
      { real: 1, imaginary: 2 },
      { real: 3, imaginary: 4 }
    ];
    const signal = signalFactory.createFromDto(signalDto);

    expect(signal.getSize()).toBe(2);

    expect(signal.getAt(0).getReal()).toBe(signalDto[0].real);
    expect(signal.getAt(0).getImaginary()).toBe(signalDto[0].imaginary);

    expect(signal.getAt(1).getReal()).toBe(signalDto[1].real);
    expect(signal.getAt(1).getImaginary()).toBe(signalDto[1].imaginary);
  });

  it('should create signal instance from raw IQ data', () => {
    const rawIQ: number[] = [1, 2, 3, 4];
    let signal = signalFactory.createFromRawIQ(rawIQ);

    expect(signal.getSize()).toBe(2);

    expect(signal.getAt(0).getReal()).toBe(rawIQ[0]);
    expect(signal.getAt(0).getImaginary()).toBe(rawIQ[1]);

    expect(signal.getAt(1).getReal()).toBe(rawIQ[2]);
    expect(signal.getAt(1).getImaginary()).toBe(rawIQ[3]);

    rawIQ.push(5);
    expect(() => {
      signal = signalFactory.createFromRawIQ(rawIQ);
    }).toThrow();
  });
});
