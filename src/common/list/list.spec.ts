// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { Injector } from 'rr-tsdi';

import { SIMPLE_MATH } from '../simple-math/di-token';
import SimpleMath from '../simple-math/simple-math';
import { ISimpleMath } from '../simple-math/simple-math.interface';
import List from './list';

describe('List', () => {
  const INDEX_ZERO_VALUE = 1000;
  const INDEX_ONE_VALUE = 2000;
  const INDEX_TWO_VALUE = 3000;
  const INDEX_ZERO = 0;
  const INDEX_ONE = 1;
  const INDEX_TWO = 2;
  const SIZE_MAX: number = 3;
  let list: List<number>;
  let simpleMath: ISimpleMath;

  beforeEach(() => {
    const injector = new Injector();

    injector.registerService(SIMPLE_MATH, SimpleMath);
    simpleMath = injector.get(SIMPLE_MATH);

    list = new List<number>(simpleMath, SIZE_MAX);
  });

  it('should create proper instance', () => {
    expect(list).toBeInstanceOf(List);
  });

  it('should clone properly', () => {
    let listClone: List<number>;

    list.append(INDEX_ZERO_VALUE);
    list.append(INDEX_ONE_VALUE);

    listClone = list.clone();

    expect(listClone.getSizeMax()).toBe(list.getSizeMax());
    expect(listClone.getSize()).toBe(list.getSize());
    expect(listClone.getAt(INDEX_ZERO)).toBe(list.getAt(INDEX_ZERO));
    expect(listClone.getAt(INDEX_ONE)).toBe(list.getAt(INDEX_ONE));

    expect(() => {
      listClone.getAt(INDEX_TWO);
    }).toThrow();

    expect(() => {
      list.getAt(INDEX_TWO);
    }).toThrow();
  });

  it('should get the value from given position or throw exception if position is outside the range', () => {
    list.append(INDEX_ZERO_VALUE);
    expect(list.getAt(INDEX_ZERO)).toBe(INDEX_ZERO_VALUE);

    expect(() => {
      list.getAt(INDEX_ONE);
    }).toThrow();
  });

  it('should set value at given position or throw exception if position is outside the range', () => {
    const newValue = 123456;

    list.append(INDEX_ZERO_VALUE);
    list.append(INDEX_ONE_VALUE);

    expect(list.getAt(INDEX_ONE)).toBe(INDEX_ONE_VALUE);
    expect(list.setAt(INDEX_ONE, newValue)).toBe(list);
    expect(list.getAt(INDEX_ONE)).toBe(newValue);

    expect(() => {
      list.setAt(INDEX_TWO, newValue);
    }).toThrow();
  });

  it('should properly append items up to size max', () => {
    expect(list.append(INDEX_ZERO_VALUE)).toBe(list);
    expect(list.append(INDEX_ONE_VALUE)).toBe(list);
    expect(list.append(INDEX_TWO_VALUE)).toBe(list);
    expect(list.getAt(INDEX_ZERO)).toBe(INDEX_ZERO_VALUE);
    expect(list.getAt(INDEX_ONE)).toBe(INDEX_ONE_VALUE);
    expect(list.getAt(INDEX_TWO)).toBe(INDEX_TWO_VALUE);
    expect(() => {
      list.append(4);
    }).toThrow();
  });

  it('should properly append array of items up to size max', () => {
    const valueArray = [
      INDEX_ZERO_VALUE,
      INDEX_ONE_VALUE,
      INDEX_TWO_VALUE
    ];

    expect(list.appendArray(valueArray)).toBe(list);
    expect(list.getAt(INDEX_ZERO)).toBe(INDEX_ZERO_VALUE);
    expect(list.getAt(INDEX_ONE)).toBe(INDEX_ONE_VALUE);
    expect(list.getAt(INDEX_TWO)).toBe(INDEX_TWO_VALUE);
    expect(() => {
      list.appendArray([4]);
    }).toThrow();
  });

  it('should properly take first element of the list', () => {
    const valueArray = [
      INDEX_ZERO_VALUE,
      INDEX_ONE_VALUE,
      INDEX_TWO_VALUE
    ];

    expect(list.appendArray(valueArray)).toBe(list);
    expect(list.getAt(INDEX_ZERO)).toBe(INDEX_ZERO_VALUE);
    expect(list.getAt(INDEX_ONE)).toBe(INDEX_ONE_VALUE);
    expect(list.getAt(INDEX_TWO)).toBe(INDEX_TWO_VALUE);
    expect(list.getSize()).toBe(3);

    expect(list.takeFirst()).toBe(INDEX_ZERO_VALUE);

    expect(list.getAt(INDEX_ZERO)).toBe(INDEX_ONE_VALUE);
    expect(list.getAt(INDEX_ONE)).toBe(INDEX_TWO_VALUE);
    expect(() => {
      list.getAt(INDEX_TWO);
    }).toThrow();
    expect(list.getSize()).toBe(2);
  });

  it('should properly take last element of the list', () => {
    const valueArray = [
      INDEX_ZERO_VALUE,
      INDEX_ONE_VALUE,
      INDEX_TWO_VALUE
    ];

    expect(list.appendArray(valueArray)).toBe(list);
    expect(list.getAt(INDEX_ZERO)).toBe(INDEX_ZERO_VALUE);
    expect(list.getAt(INDEX_ONE)).toBe(INDEX_ONE_VALUE);
    expect(list.getAt(INDEX_TWO)).toBe(INDEX_TWO_VALUE);
    expect(list.getSize()).toBe(3);

    expect(list.takeLast()).toBe(INDEX_TWO_VALUE);

    expect(list.getAt(INDEX_ZERO)).toBe(INDEX_ZERO_VALUE);
    expect(list.getAt(INDEX_ONE)).toBe(INDEX_ONE_VALUE);
    expect(() => {
      list.getAt(INDEX_TWO);
    }).toThrow();
    expect(list.getSize()).toBe(2);
  });

  // it('should properly fill the list with value', () => {
  // });

  // --------

  it('should return proper size of the list', () => {
    expect(list.getSize()).toBe(0);
    list.append(1);
    expect(list.getSize()).toBe(1);
    list.append(2);
    expect(list.getSize()).toBe(2);
    list.append(3);
    expect(list.getSize()).toBe(3);
    try {
      list.append(4);
    } catch (e) {
      /* tslint:disable:no-empty */
    }
    expect(list.getSize()).toBe(3);
  });

  it('should return same size max value as passed to constructor', () => {
    expect(list.getSizeMax()).toBe(SIZE_MAX);
  });

  it('should properly update size max and return new value', () => {
    const SIZE_MAX_NEW: number = 20;

    expect(list.setSizeMax(SIZE_MAX_NEW)).toBe(list);
    expect(list.getSizeMax()).toBe(SIZE_MAX_NEW);
  });

  it('should return array of items', () => {
    let result: number[];

    list.append(1);
    list.append(2);
    result = list.toArray();

    expect(result).toEqual([1, 2]);
  });
});
