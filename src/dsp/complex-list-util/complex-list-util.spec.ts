// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { Injector } from 'rr-tsdi';

import { LIST_FACTORY, SIMPLE_MATH } from './../../common';
import { PRECISION_DIGITS } from './../../di-token';
import { COMPLEX_DEPENDENCY_BAG, COMPLEX_FACTORY } from './../complex/di-token';
import { COMPLEX_LIST_UTIL } from './di-token';

import { IList, IListFactory, ListFactory, SimpleMath } from './../../common';

import { precisionDigits } from './../../settings';
import { IComplexListDto, IComplexListUtil } from './../complex-list-util/complex-list-util.interface';
import { ComplexDependencyBag } from './../complex/complex-dependency-bag';
import { ComplexFactory } from './../complex/complex-factory';
import { IComplexFactory } from './../complex/complex-factory.interface';
import { IComplex, IComplexDto } from './../complex/complex.interface';
import { ComplexListUtil } from './complex-list-util';

describe('ComplexListUtil', () => {
  let complexListUtil: IComplexListUtil;
  let listFactory: IListFactory;
  let complexFactory: IComplexFactory;

  beforeEach(() => {
    const injector = new Injector();

    injector.registerService(COMPLEX_DEPENDENCY_BAG, ComplexDependencyBag);
    injector.registerValue(PRECISION_DIGITS, precisionDigits);
    injector.registerService(COMPLEX_FACTORY, ComplexFactory);
    injector.registerService(SIMPLE_MATH, SimpleMath);
    injector.registerService(LIST_FACTORY, ListFactory);
    injector.registerService(COMPLEX_LIST_UTIL, ComplexListUtil);

    complexListUtil = injector.get(COMPLEX_LIST_UTIL);
    listFactory = injector.get(LIST_FACTORY);
    complexFactory = injector.get(COMPLEX_FACTORY);
  });

  it('should create proper instance', () => {
    expect(complexListUtil).toBeInstanceOf(ComplexListUtil);
  });

  it('should create a complex list from ComplexList DTO', () => {
    const complexListDto = [
      { real: 1, imaginary: 2 },
      { real: 3, imaginary: 4 }
    ];
    const complexList = complexListUtil.fromDto(complexListDto);

    expect(complexList.getSize()).toBe(2);

    expect(complexList.getAt(0).getReal()).toBe(complexListDto[0].real);
    expect(complexList.getAt(0).getImaginary()).toBe(complexListDto[0].imaginary);

    expect(complexList.getAt(1).getReal()).toBe(complexListDto[1].real);
    expect(complexList.getAt(1).getImaginary()).toBe(complexListDto[1].imaginary);
  });

  it('should create a complex list from raw IQ data', () => {
    const rawIQ = [1, 2, 3, 4];
    let complexList = complexListUtil.fromRawIQ(rawIQ);

    expect(complexList.getSize()).toBe(2);

    expect(complexList.getAt(0).getReal()).toBe(rawIQ[0]);
    expect(complexList.getAt(0).getImaginary()).toBe(rawIQ[1]);

    expect(complexList.getAt(1).getReal()).toBe(rawIQ[2]);
    expect(complexList.getAt(1).getImaginary()).toBe(rawIQ[3]);

    rawIQ.push(5);
    expect(() => {
      complexList = complexListUtil.fromRawIQ(rawIQ);
    }).toThrow();
  });

  it('should convert complex list into ComplexList DTO', () => {
    const complexList: IList<IComplex> = listFactory.create<IComplex>(2);
    let complexListDto: IComplexListDto;

    complexList.append(complexFactory.create(1, 2));
    complexList.append(complexFactory.create(3, 4));

    complexListDto = complexListUtil.toDto(complexList);

    expect(complexListDto).toEqual(
      [
        { real: 1, imaginary: 2 },
        { real: 3, imaginary: 4 }
      ]
    );
  });

  it('should convert complex list into raw IQ data', () => {
    const complexList: IList<IComplex> = listFactory.create<IComplex>(2);
    let rawIQ: number[];

    complexList.append(complexFactory.create(1, 2));
    complexList.append(complexFactory.create(3, 4));

    rawIQ = complexListUtil.toRawIQ(complexList);

    expect(rawIQ).toEqual([1, 2, 3, 4]);
  });
});
