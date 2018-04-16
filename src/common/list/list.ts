// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { staticImplements } from 'rr-tsdi';

import { IList, IListStatic } from './list.interface';

@staticImplements<IListStatic<T>>()
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

  public setSizeMax(sizeMax: number): void {
    this.positionStart = 0;
    this.positionEnd = 0;
    this.size = 0;
    this.sizeMax = sizeMax;
    this.data.length = 0;        // drop all data
    this.data.length = sizeMax;  // pre-allokate space
  }

  public append(value: T): boolean {
    if (this.size === this.sizeMax) {
      return false;
    }

    this.data[this.positionEnd] = value;
    this.positionEnd = (this.positionEnd + 1) % this.sizeMax;
    this.size++;

    return true;
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

  List.prototype.getItem = function (index) {
    if (index >= this.$$size || index < 0) {
      return null;
    }

    return this.$$data[(this.$$positionStart + index) % this.$$sizeMax];
  }

  List.prototype.getSize = function () {
    return this.$$size;
  }
  */

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
        this.getItem(i)
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
}

export default List;
