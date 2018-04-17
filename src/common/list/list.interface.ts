// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { ISimpleMath } from '../simple-math/simple-math.interface';

interface IList<T> {
  clone(): IList<T>;
  getAt(position: number): T;
  setAt(position: number, value: T): IList<T>;
  append(value: T): IList<T>;
  // appendEvenIfFull(value: T): IList<T>;
  appendArray(valueArray: T[]): IList<T>;
  // appendArrayEvenIfFull(value: T): IList<T>;
  takeFirst(): T;
  takeLast(): T;
  fillWith(value: T, size: number): IList<T>;

  // --------

  getSize(): number;
  getSizeMax(): number;
  setSizeMax(sizeMax: number): IList<T>;

  // isFull(): boolean;
  // isEmpty(): boolean;

  // touchedReset(): IList<T>
  // touched(): boolean
  // forEach() ???
  // getSkipedList ???

  toArray(): T[];

  /*
getAt            OK
setAt            OK
append           OK
appendArray      OK
takeFirst        OK
takeLast         OK
fillWith()       tests missing

getSize
getSizeMax
setSizeMax()

isFull
isEmpty

touchedReset()
touched()
forEach(item => {})

getSkipedList(offset = 0, skipAmount = 2)

toArray()
  */
}

interface IListStatic<T> {
  new(simpleMath: ISimpleMath, sizeMax: number): IList<T>;
}

export {
  IList,
  IListStatic
};
