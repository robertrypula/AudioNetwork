// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { Injector } from 'rr-tsdi';

import { LIST_FACTORY } from '../../../common/list/di-token';
import ListFactory from '../../../common/list/list-factory';
import { IListFactory } from '../../../common/list/list-factory.interface';
import { IList } from '../../../common/list/list.interface';
import { SIMPLE_MATH } from '../../../common/simple-math/di-token';
import SimpleMath from '../../../common/simple-math/simple-math';
import ComplexFactory from '../../complex/complex-factory';
import { IComplexFactory } from '../../complex/complex-factory.interface';
import { IComplex } from '../../complex/complex.interface';
import { COMPLEX_FACTORY } from '../../complex/di-token';
import { FOURIER_TRANSFORM } from '../di-token';
import { IFourierTransform } from '../fourier-transform.interface';
import Fft from './fft';
import { fftTestCaseA } from './fft.spec-data';

describe('Fft', () => {
  let fft: IFourierTransform;
  let complexFactory: IComplexFactory;
  let listFactory: IListFactory;

  beforeEach(() => {
    const injector = new Injector();

    injector.registerService(SIMPLE_MATH, SimpleMath);
    injector.registerService(COMPLEX_FACTORY, ComplexFactory);
    injector.registerService(LIST_FACTORY, ListFactory);
    injector.registerService(FOURIER_TRANSFORM, Fft);

    fft = injector.get(FOURIER_TRANSFORM);
    complexFactory = injector.get(COMPLEX_FACTORY);
    listFactory = injector.get(LIST_FACTORY);
  });

  it('should properly compute forward FFT (test case A)', () => {
    const tmp: IComplex[] = fftTestCaseA.input.map((v: number[]): IComplex => complexFactory.create(v[0], v[1]));
    const input: IList<IComplex> = listFactory.createFromArray<IComplex>(tmp);
    let output: IList<IComplex>;
    let tmp2: any[];

    output = fft.forward(input);
    tmp2 = output.toArray().map((value: IComplex): number[] => [value.getReal(), value.getImaginary()]);

    expect(tmp2).toEqual(fftTestCaseA.output);
  });
});
