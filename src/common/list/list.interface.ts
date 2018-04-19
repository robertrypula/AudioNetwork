// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { ISimpleMath } from '../simple-math/simple-math.interface';

interface IList<T> {
  clone(): IList<T>;
  getAt(position: number): T;
  setAt(position: number, value: T): IList<T>;
  append(value: T): IList<T>;
  appendEvenIfFull(value: T): IList<T>;
  appendArray(valueArray: T[]): IList<T>;
  // appendArrayEvenIfFull(value: T): IList<T>;
  takeFirst(): T;
  takeLast(): T;
  fillWith(value: T, size?: number): IList<T>;
  isFull(): boolean;
  isEmpty(): boolean;
  setSizeMax(sizeMax: number): IList<T>;
  getSizeMax(): number;
  getSize(): number;
  // touchedReset(): IList<T>
  // touched(): boolean
  forEach(callback: (value: T, index?: number) => void | boolean): IList<T>;
  filter(callback: (value: T, index?: number) => boolean): IList<T>;
  toArray(): T[];
}

interface IListStatic<T> {
  new(simpleMath: ISimpleMath, sizeMax: number): IList<T>;
}

export {
  IList,
  IListStatic
};
