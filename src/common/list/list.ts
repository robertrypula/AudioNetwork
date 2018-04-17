// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { staticImplements } from 'rr-tsdi';

import GenericException from '../../generic-exception';
import { IList, IListStatic } from './list.interface';

// @staticImplements<IListStatic<T>>()
class List<T> implements IList<T> {
  private data: T[];
  private positionStart: number;
  private positionEnd: number;
  private size: number;
  private sizeMax: number;

  constructor(sizeMax: number) {
    this.data = [];
    this.setSizeMax(sizeMax);
  }

  public clone(): List<T> {
    const list = new List<T>(this.sizeMax);
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

  // --------

  public setSizeMax(sizeMax: number): void {
    this.positionStart = 0;
    this.positionEnd = 0;
    this.size = 0;
    this.sizeMax = sizeMax;
    this.data.length = 0;        // drop all data
    this.data.length = sizeMax;  // pre-allokate space
  }

  /*
  List.prototype.pushEvenIfFull = function (value) {
    if (this.isFull()) {
      this.pop();
    }
    this.push(value);
  }

  List.prototype.pop = function () {
    var result;

    if (this.$$size === 0) {
      return null;
    }
    result = this.$$data[this.$$positionStart];
    this.$$positionStart = (this.$$positionStart + 1) % this.$$sizeMax;
    this.$$size--;

    return result;
  }
  */

  public getSize() {
    return this.size;
  }

  public getSizeMax(): number {
    return this.sizeMax;
  }

  /*
  List.prototype.isFull = function () {
    return this.$$size === this.$$sizeMax;
  }

  List.prototype.getAll = function () {
    var i, result = [];

    for (i = 0; i < this.getSize(); i++) {
      result.push(
        this.getAt(i)
      );
    }

    return result;
  }

  List.prototype.fillWith = function (value) {
    var i;

    for (i = 0; i < this.getSizeMax(); i++) {
      this.pushEvenIfFull(value);
    }
  }
  */

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
