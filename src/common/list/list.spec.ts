// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import List from './list';

describe('List', () => {
  const SIZE_MAX: number = 4;
  let list: List<number>;

  beforeEach(() => {
    list = new List<number>(SIZE_MAX);
  });

  it('should clone properly', () => {
    let listClone: List<number>;

    list.append(1);
    list.append(2);

    listClone = list.clone();

    expect(listClone.getSizeMax()).toBe(SIZE_MAX);
    // TODO more checks
  });

  it('should create proper instance', () => {
    expect(list).toBeInstanceOf(List);
  });

  it('should properly add items up to size max', () => {
    expect(list.append(1)).toBe(true);
    expect(list.append(2)).toBe(true);
    expect(list.append(3)).toBe(true);
    expect(list.append(4)).toBe(true);
    expect(list.append(5)).toBe(false);
  });

  it('should return same size max value as passed to constructor', () => {
    expect(list.getSizeMax()).toBe(SIZE_MAX);
  });

  it('should properly update size max and return new value', () => {
    const SIZE_MAX_NEW: number = 20;

    list.setSizeMax(SIZE_MAX_NEW);
    expect(list.getSizeMax()).toBe(SIZE_MAX_NEW);
  });
});
