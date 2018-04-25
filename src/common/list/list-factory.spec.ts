// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { Injector } from 'rr-tsdi';

import { SIMPLE_MATH } from './../simple-math/di-token';
import { LIST_FACTORY } from './di-token';

import SimpleMath from './../simple-math/simple-math';
import List from './list';
import ListFactory from './list-factory';

describe('ListFactory', () => {
  let listFactory: ListFactory;

  beforeEach(() => {
    const injector = new Injector();

    injector.registerService(SIMPLE_MATH, SimpleMath);
    injector.registerService(LIST_FACTORY, ListFactory);
    listFactory = injector.get(LIST_FACTORY);
  });

  it('should create proper instance', () => {
    expect(listFactory).toBeInstanceOf(ListFactory);
  });

  it('should create instance of List class with proper max size', () => {
    const SIZE_MAX = 10;
    const list: List<number> = listFactory.create<number>(SIZE_MAX);

    expect(list).toBeInstanceOf(List);
    expect(list.getSizeMax()).toBe(SIZE_MAX);
  });

  it('should properly use generic type', () => {
    const SIZE_MAX = 10;
    const listNumber: List<number> = listFactory.create<number>(SIZE_MAX);
    const listString: List<string> = listFactory.create<string>(SIZE_MAX);
    const listObject: List<object> = listFactory.create<object>(SIZE_MAX);

    listNumber.append(123);
    expect(listNumber.takeFirst()).toEqual(jasmine.any(Number));

    listString.append('123');
    expect(listString.takeFirst()).toEqual(jasmine.any(String));

    listObject.append({ value: 123 });
    expect(listObject.takeFirst()).toEqual(jasmine.any(Object));
  });

  it('should create instance of List class for given array and optional max size', () => {
    const SIZE_MAX = 3;
    const valueArray = [1, 2, 3, 4, 5, 6];
    const listFull: List<number> = listFactory.createFromArray<number>(valueArray);
    const listFixedSize: List<number> = listFactory.createFromArray<number>(valueArray, SIZE_MAX);

    expect(listFull.toArray()).toEqual(valueArray);
    expect(listFixedSize.toArray()).toEqual([4, 5, 6]);
  });
});
