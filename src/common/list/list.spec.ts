// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { Injector } from 'rr-tsdi';

import { SIMPLE_MATH } from './../simple-math/di-token';

import { SimpleMath } from './../simple-math/simple-math';
import { ISimpleMath } from './../simple-math/simple-math.interface';
import { List } from './list';

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

  it('should properly append new item to the list and remove first item when needed without throwing error', () => {
    const value = 123456;

    expect(list.appendEvenIfFull(INDEX_ZERO_VALUE)).toBe(list);
    expect(list.appendEvenIfFull(INDEX_ONE_VALUE)).toBe(list);
    expect(list.appendEvenIfFull(INDEX_TWO_VALUE)).toBe(list);

    expect(list.getAt(INDEX_ZERO)).toBe(INDEX_ZERO_VALUE);
    expect(list.getAt(INDEX_ONE)).toBe(INDEX_ONE_VALUE);
    expect(list.getAt(INDEX_TWO)).toBe(INDEX_TWO_VALUE);

    expect(list.appendEvenIfFull(value)).toBe(list);

    expect(list.getAt(INDEX_ZERO)).toBe(INDEX_ONE_VALUE);
    expect(list.getAt(INDEX_ONE)).toBe(INDEX_TWO_VALUE);
    expect(list.getAt(INDEX_TWO)).toBe(value);
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

  it('should properly take first element of the list but only if available', () => {
    const valueArray = [
      INDEX_ZERO_VALUE,
      INDEX_ONE_VALUE,
      INDEX_TWO_VALUE
    ];

    expect(() => {
      list.takeFirst();
    }).toThrow();

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

  it('should properly take last element of the list but only if available', () => {
    const valueArray = [
      INDEX_ZERO_VALUE,
      INDEX_ONE_VALUE,
      INDEX_TWO_VALUE
    ];

    expect(() => {
      list.takeLast();
    }).toThrow();

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

  it('should properly fill the list with value', () => {
    const value1 = 11111;
    const value2 = 22222;

    list.fillWith(value1, 2);

    expect(list.getAt(INDEX_ZERO)).toBe(value1);
    expect(list.getAt(INDEX_ONE)).toBe(value1);
    expect(() => {
      list.getAt(INDEX_TWO);
    }).toThrow();

    list.fillWith(value2);
    expect(list.getAt(INDEX_ZERO)).toBe(value2);
    expect(list.getAt(INDEX_ONE)).toBe(value2);
    expect(list.getAt(INDEX_TWO)).toBe(value2);
  });

  it('should return true when list is full', () => {
    expect(list.isFull()).toBe(false);
    list.append(1);
    expect(list.isFull()).toBe(false);
    list.append(1);
    expect(list.isFull()).toBe(false);
    list.append(1);
    expect(list.isFull()).toBe(true);
  });

  it('should return true when list is empty', () => {
    expect(list.isEmpty()).toBe(true);
    list.append(1);
    expect(list.isEmpty()).toBe(false);
    list.takeFirst();
    expect(list.isEmpty()).toBe(true);
  });

  it('should properly update size max and return new value', () => {
    const SIZE_MAX_NEW: number = 20;

    expect(list.setSizeMax(SIZE_MAX_NEW)).toBe(list);
    expect(list.getSizeMax()).toBe(SIZE_MAX_NEW);
  });

  it('should return same size max value as passed to constructor', () => {
    expect(list.getSizeMax()).toBe(SIZE_MAX);
  });

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
      /* tslint:disable-next-line:no-empty */
    } catch (e) { }
    expect(list.getSize()).toBe(3);
  });

  it('should properly iterate trought the list items', () => {
    const checkValue: number[] = [];
    const checkIndex: number[] = [];

    list.append(1);
    list.append(2);
    list.forEach((value) => {
      checkValue.push(value);
    });
    expect(checkValue).toEqual([1, 2]);

    checkValue.length = 0;
    list.appendEvenIfFull(111);
    list.appendEvenIfFull(222);
    list.forEach((value, index) => {
      checkValue.push(value);
      checkIndex.push(index);
    });
    expect(checkValue).toEqual([2, 111, 222]);
    expect(checkIndex).toEqual([0, 1, 2]);

    checkValue.length = 0;
    checkIndex.length = 0;
    list.forEach((value, index) => {
      checkValue.push(value);
      checkIndex.push(index);

      return false;   // 'false' means break the loop
    });
    expect(checkValue).toEqual([2]);
    expect(checkIndex).toEqual([0]);
  });

  it('should properly filter the list items and the new list should be full', () => {
    const checkValue: number[] = [];
    const checkIndex: number[] = [];
    let filteredList: List<number>;

    list.appendArray([1, 2, 3]);
    filteredList = list.filter((value) => {
      if (value === 2) {
        checkValue.push(value);
        return true;
      }

      return false;
    });
    expect(checkValue).toEqual([2]);
    expect(filteredList.getAt(0)).toBe(2);
    expect(filteredList.getSize()).toBe(1);
    expect(filteredList.getSizeMax()).toBe(1);
    expect(filteredList.isFull()).toBe(true);
  });

  it('should return array of items', () => {
    let result: number[];

    list.append(1);
    list.append(2);
    result = list.toArray();

    expect(result).toEqual([1, 2]);
  });
});
