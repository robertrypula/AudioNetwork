// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { Injector } from 'rr-tsdi';

import { LIST_FACTORY, SIMPLE_MATH } from './../../common/index';
import { COMPLEX_FACTORY } from './../complex/di-token';
import { COMPLEX_LIST_UTIL } from './di-token';

import ListFactory from './../../common/list/list-factory';
import SimpleMath from './../../common/simple-math/simple-math';
import ComplexFactory from './../complex/complex-factory';
import ComplexListUtil from './complex-list-util';

describe('ComplexListUtil', () => {
  let complexListUtil: ComplexListUtil;

  beforeEach(() => {
    const injector = new Injector();

    injector.registerService(COMPLEX_FACTORY, ComplexFactory);
    injector.registerService(SIMPLE_MATH, SimpleMath);
    injector.registerService(LIST_FACTORY, ListFactory);
    injector.registerService(COMPLEX_LIST_UTIL, ComplexListUtil);

    complexListUtil = injector.get(COMPLEX_LIST_UTIL);
  });

  it('should create proper instance', () => {
    expect(complexListUtil).toBeInstanceOf(ComplexListUtil);
  });

  // TODO write tests for rest of the methods
});
