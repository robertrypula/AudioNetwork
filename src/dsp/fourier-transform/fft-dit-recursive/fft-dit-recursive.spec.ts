// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { Injector } from 'rr-tsdi';

import { LIST_FACTORY, SIMPLE_MATH } from './../../../common';
import { PRECISION_DIGITS } from './../../../di-token';
import { COMPLEX_DEPENDENCY_BAG, COMPLEX_FACTORY } from './../../complex/di-token';
import { SIGNAL_FACTORY } from './../../signal/di-token';
import { FOURIER_TRANSFORM } from './../di-token';

import { ListFactory, SimpleMath } from './../../../common';
import { precisionDigits } from './../../../settings';
import { ComplexDependencyBag } from './../../complex/complex-dependency-bag';
import { ComplexFactory } from './../../complex/complex-factory';
import { IComplexDto } from './../../complex/complex.interface';
import { SignalFactory } from './../../signal/signal-factory';
import { ISignalFactory } from './../../signal/signal-factory.interface';
import { ISignal, ISignalDto } from './../../signal/signal.interface';
import { IFourierTransform, IFourierTransformTestCase } from './../fourier-transform.interface';
import {
  fourierTransformTestCaseA,
  fourierTransformTestCaseB,
  fourierTransformTestCaseC
} from './../fourier-transform.spec-data';
import { FftDitRecursive } from './fft-dit-recursive';

describe('Fft', () => {
  let fft: IFourierTransform;
  let signalFactory: ISignalFactory;

  beforeEach(() => {
    const injector = new Injector();

    injector.registerService(COMPLEX_DEPENDENCY_BAG, ComplexDependencyBag);
    injector.registerValue(PRECISION_DIGITS, precisionDigits);
    injector.registerService(SIMPLE_MATH, SimpleMath);
    injector.registerService(COMPLEX_FACTORY, ComplexFactory);
    injector.registerService(LIST_FACTORY, ListFactory);
    injector.registerService(SIGNAL_FACTORY, SignalFactory);
    injector.registerService(FOURIER_TRANSFORM, FftDitRecursive);

    fft = injector.get(FOURIER_TRANSFORM);
    signalFactory = injector.get(SIGNAL_FACTORY);
  });

  it('should properly compute forward FFT (Recursive, Decimation in time) for all test cases', () => {
    const testCaseVector: IFourierTransformTestCase[] = [
      fourierTransformTestCaseA,
      fourierTransformTestCaseB,
      fourierTransformTestCaseC
    ];
    let inputDto: ISignalDto;
    let outputDto: ISignalDto;
    let outputExpectationDto: ISignalDto;
    let input: ISignal;
    let output: ISignal;
    let outputExpectation: ISignal;

    testCaseVector.forEach((testCase: IFourierTransformTestCase) => {
      inputDto = testCase.input;
      outputExpectationDto = testCase.output;

      input = signalFactory.fromDto(inputDto);
      output = fft.forward(input);
      outputDto = signalFactory.toDto(output);
      outputDto.forEach((v: IComplexDto, i: number) => {
        expect(v.real).toBeCloseTo(outputExpectationDto[i].real, precisionDigits);
        expect(v.imaginary).toBeCloseTo(outputExpectationDto[i].imaginary, precisionDigits);
      });

      // alternative equality check
      outputExpectation = signalFactory.fromDto(outputExpectationDto);
      expect(signalFactory.isEqual(output, outputExpectation)).toBe(true);
    });
  });

  it('should return same output as input for all test cases - fft.inverse(ftt.forward())', () => {
    const testCaseVector: IFourierTransformTestCase[] = [
      fourierTransformTestCaseA,
      fourierTransformTestCaseB,
      fourierTransformTestCaseC
    ];
    let inputDto: ISignalDto;
    let outputDto: ISignalDto;
    let input: ISignal;
    let output: ISignal;

    testCaseVector.forEach((testCase: IFourierTransformTestCase) => {
      inputDto = testCase.input;

      input = signalFactory.fromDto(inputDto);
      output = fft.inverse(fft.forward(input));
      outputDto = signalFactory.toDto(output);
      outputDto.forEach((v: IComplexDto, i: number) => {
        expect(v.real).toBeCloseTo(testCase.input[i].real, precisionDigits);
        expect(v.imaginary).toBeCloseTo(testCase.input[i].imaginary, precisionDigits);
      });

      // alternative equality check
      expect(signalFactory.isEqual(output, input)).toBe(true);
    });
  });
});
