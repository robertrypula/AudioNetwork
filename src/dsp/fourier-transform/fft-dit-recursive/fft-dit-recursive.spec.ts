// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { Injector } from 'rr-tsdi';

import { LIST_FACTORY, SIMPLE_MATH } from './../../../common';
import { COMPLEX_LIST_UTIL } from './../../complex-list-util/di-token';
import { COMPLEX_FACTORY } from './../../complex/di-token';
import { FOURIER_TRANSFORM } from './../di-token';

import { IList, IListFactory, ListFactory, SimpleMath } from './../../../common';
import ComplexListUtil from './../../complex-list-util/complex-list-util';
import { IComplexListDto, IComplexListUtil } from './../../complex-list-util/complex-list-util.interface';
import ComplexFactory from './../../complex/complex-factory';
import { IComplexFactory } from './../../complex/complex-factory.interface';
import { IComplex, IComplexDto } from './../../complex/complex.interface';
import { IFourierTransform, IFourierTransformTestCase } from './../fourier-transform.interface';
import {
  fourierTransformTestCaseA,
  fourierTransformTestCaseB,
  fourierTransformTestCaseC
} from './../fourier-transform.spec-data';
import FftDitRecursive from './fft-dit-recursive';

describe('Fft', () => {
  let fft: IFourierTransform;
  let complexListUtil: IComplexListUtil;

  beforeEach(() => {
    const injector = new Injector();

    injector.registerService(SIMPLE_MATH, SimpleMath);
    injector.registerService(COMPLEX_FACTORY, ComplexFactory);
    injector.registerService(LIST_FACTORY, ListFactory);
    injector.registerService(COMPLEX_LIST_UTIL, ComplexListUtil);
    injector.registerService(FOURIER_TRANSFORM, FftDitRecursive);

    fft = injector.get(FOURIER_TRANSFORM);
    complexListUtil = injector.get(COMPLEX_LIST_UTIL);
  });

  it('should properly compute forward FFT (Recursive, Decimation in time) for all test cases', () => {
    const testCaseVector: IFourierTransformTestCase[] = [
      fourierTransformTestCaseA,
      fourierTransformTestCaseB,
      fourierTransformTestCaseC
    ];
    let inputDto: IComplexListDto;
    let outputDto: IComplexListDto;
    let outputExpectationDto: IComplexListDto;
    let input: IList<IComplex>;
    let output: IList<IComplex>;

    testCaseVector.forEach((testCase: IFourierTransformTestCase) => {
      inputDto = testCase.input;
      outputExpectationDto = testCase.output;

      input = complexListUtil.fromDto(inputDto);
      output = fft.forward(input);
      outputDto = complexListUtil.toDto(output);
      outputDto.forEach((v: IComplexDto, i: number) => {
        expect(v.real).toBeCloseTo(outputExpectationDto[i].real, 6);
        expect(v.imaginary).toBeCloseTo(outputExpectationDto[i].imaginary, 6);
      });
      // expect(outputDto).toEqual(outputExpectationDto);
    });
  });

  it('should return same output as input for all test cases - fft.inverse(ftt.forward())', () => {
    const testCaseVector: IFourierTransformTestCase[] = [
      fourierTransformTestCaseA,
      fourierTransformTestCaseB,
      fourierTransformTestCaseC
    ];
    let inputDto: IComplexListDto;
    let outputDto: IComplexListDto;
    let input: IList<IComplex>;
    let output: IList<IComplex>;

    testCaseVector.forEach((testCase: IFourierTransformTestCase) => {
      inputDto = testCase.input;

      input = complexListUtil.fromDto(inputDto);
      output = fft.inverse(fft.forward(input));
      outputDto = complexListUtil.toDto(output);
      outputDto.forEach((v: IComplexDto, i: number) => {
        expect(v.real).toBeCloseTo(testCase.input[i].real, 6);
        expect(v.imaginary).toBeCloseTo(testCase.input[i].imaginary, 6);
      });
      // expect(outputDto).toEqual(outputExpectationDto);
    });
  });

  /*
  complex.isEqualTo(b: IComplex, epsilon)     move epsilon to DI/config

  */
});
