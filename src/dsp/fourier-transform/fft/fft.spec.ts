// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { Injector } from 'rr-tsdi';

import { LIST_FACTORY } from '../../../common/list/di-token';
import ListFactory from '../../../common/list/list-factory';
import { IListFactory } from '../../../common/list/list-factory.interface';
import { IList } from '../../../common/list/list.interface';
import { SIMPLE_MATH } from '../../../common/simple-math/di-token';
import SimpleMath from '../../../common/simple-math/simple-math';
import ComplexListUtil from '../../complex-list-util/complex-list-util';
import { IComplexListDto, IComplexListUtil } from '../../complex-list-util/complex-list-util.interface';
import { COMPLEX_LIST_UTIL } from '../../complex-list-util/di-token';
import ComplexFactory from '../../complex/complex-factory';
import { IComplexFactory } from '../../complex/complex-factory.interface';
import { IComplex } from '../../complex/complex.interface';
import { COMPLEX_FACTORY } from '../../complex/di-token';
import { FOURIER_TRANSFORM } from '../di-token';
import { IFourierTransform } from '../fourier-transform.interface';
import { fourierTransformTestCaseA } from '../fourier-transform.spec-data';
import Fft from './fft';

describe('Fft', () => {
  let fft: IFourierTransform;
  let complexListUtil: IComplexListUtil;

  beforeEach(() => {
    const injector = new Injector();

    injector.registerService(SIMPLE_MATH, SimpleMath);
    injector.registerService(COMPLEX_FACTORY, ComplexFactory);
    injector.registerService(LIST_FACTORY, ListFactory);
    injector.registerService(COMPLEX_LIST_UTIL, ComplexListUtil);
    injector.registerService(FOURIER_TRANSFORM, Fft);

    fft = injector.get(FOURIER_TRANSFORM);
    complexListUtil = injector.get(COMPLEX_LIST_UTIL);
  });

  it('should properly compute forward FFT (test case A)', () => {
    const complexListDto = fourierTransformTestCaseA.input;
    const input: IList<IComplex> = complexListUtil.fromDto(complexListDto);
    let output: IList<IComplex>;
    let result: IComplexListDto;

    output = fft.forward(input);
    result = complexListUtil.toDto(output);

    result.map((v, i) => {
      expect(v.real).toBeCloseTo(fourierTransformTestCaseA.output[i].real, 6);
      expect(v.imaginary).toBeCloseTo(fourierTransformTestCaseA.output[i].imaginary, 6);
    });
  });

  /*
  complex.isEqualTo(b: IComplex, epsilon)     move epsilon to DI/config

  Signal class API proposal

    signal.fromReal([1, 2, 3]);
    signal.mix(Signal.complexSpiral(cyclesInLength, length));
    signal.lowPass(0.5, );
  */
});
