// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { staticImplements } from 'rr-tsdi';

import GenericException from './../generic-exception/generic-exception';
import { ISimpleMath } from './../simple-math/simple-math.interface';
import { IList, IListStatic } from './list.interface';

@staticImplements<IListStatic<T>>()
class List<T> implements IList<T> {
  protected data: T[];
  protected positionStart: number;
  protected positionEnd: number;
  protected size: number;
  protected sizeMax: number;

  constructor(
    protected simpleMath: ISimpleMath,
    sizeMax: number
  ) {
    this.data = [];
    this.setSizeMax(sizeMax);
  }

  public clone(): List<T> {
    const list = new List<T>(this.simpleMath, this.sizeMax);
    const dataLength = this.data.length;
    let i;

    list.positionStart = this.positionStart;
    list.positionEnd = this.positionEnd;
    list.size = this.size;

    for (i = 0; i < dataLength; i++) {
      list.data[i] = this.data[i];
    }

    return list;
  }

  public getAt(position: number): T {
    if (position >= this.size || position < 0) {
      throw new GenericException(POSITION_OUTSIDE_THE_RANGE, position);
    }

    return this.data[(this.positionStart + position) % this.sizeMax];
  }

  public setAt(position: number, value: T): List<T> {
    if (position >= this.size || position < 0) {
      throw new GenericException(POSITION_OUTSIDE_THE_RANGE, position);
    }

    this.data[(this.positionStart + position) % this.sizeMax] = value;

    return this;
  }

  public append(value: T): List<T> {
    if (this.size === this.sizeMax) {
      throw new GenericException(LIST_FULL, value);
    }

    this.data[this.positionEnd] = value;
    this.positionEnd = (this.positionEnd + 1) % this.sizeMax;
    this.size++;

    return this;
  }

  public appendEvenIfFull(value: T): List<T> {
    if (this.isFull()) {
      this.takeFirst();
    }
    this.append(value);

    return this;
  }

  public appendArray(valueArray: T[]): List<T> {
    let i;

    for (i = 0; i < valueArray.length; i++) {
      this.append(valueArray[i]);
    }

    return this;
  }

  public takeFirst(): T {
    let result: T;

    if (this.size === 0) {
      throw new GenericException(LIST_EMPTY_NOTHING_TO_TAKE);
    }

    result = this.data[this.positionStart];
    this.positionStart = (this.positionStart + 1) % this.sizeMax;
    this.size--;

    return result;
  }

  public takeLast(): T {
    let result: T;

    if (this.size === 0) {
      throw new GenericException(LIST_EMPTY_NOTHING_TO_TAKE);
    }

    this.positionEnd = (this.positionEnd + this.sizeMax - 1) % this.sizeMax;
    result = this.data[this.positionEnd];
    this.size--;

    return result;
  }

  public fillWith(value: T, size: number = Infinity): IList<T> {
    const limit = this.simpleMath.min(this.sizeMax, size);
    let i;

    for (i = 0; i < limit; i++) {
      this.appendEvenIfFull(value);
    }

    return this;
  }

  public isFull(): boolean {
    return this.size === this.sizeMax;
  }

  public isEmpty(): boolean {
    return this.size === 0;
  }

  public setSizeMax(sizeMax: number): IList<T> {
    this.positionStart = 0;
    this.positionEnd = 0;
    this.size = 0;
    this.sizeMax = sizeMax;
    this.data.length = 0;        // drop all data
    this.data.length = sizeMax;  // pre-allokate space

    return this;
  }

  public getSizeMax(): number {
    return this.sizeMax;
  }

  public getSize() {
    return this.size;
  }

  public forEach(callback: (item: T, index?: number) => void | boolean): List<T> {
    let i;

    for (i = 0; i < this.getSize(); i++) {
      if (callback(this.getAt(i), i) === false) {
        break;
      }
    }

    return this;
  }

  public filter(callback: (value: T, index?: number) => boolean): List<T> {
    const resultTmpArray: T[] = [];
    let result: List<T>;
    let value: T;
    let i;

    for (i = 0; i < this.getSize(); i++) {
      value = this.getAt(i);
      if (callback(value, i) === true) {
        resultTmpArray.push(value);
      }
    }

    result = new List<T>(
      this.simpleMath,
      resultTmpArray.length
    );
    result.appendArray(resultTmpArray);

    return result;
  }

  public toArray(): T[] {
    let result: T[];
    let i;

    result = [];
    for (i = 0; i < this.getSize(); i++) {
      result.push(this.getAt(i));
    }

    return result;
  }
}

const POSITION_OUTSIDE_THE_RANGE = 'Given position is outside the range';
const LIST_FULL = 'List is full';
const LIST_EMPTY_NOTHING_TO_TAKE = 'There is nothing to take, list is empty';

export default List;
