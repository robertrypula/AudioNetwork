// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

interface IList<T> {
  clone(): IList<T>;
  getAt(position: number): T;
  setAt(position: number, value: T): IList<T>;
  append(value: T): IList<T>;
  appendArray(valueArray: T[]): IList<T>;
  takeFirst(): T;

  // --------

  setSizeMax(sizeMax: number): void;
  getSize(): number;
  getSizeMax(): number;
  toArray(): T[];

  /*
getAt
setAt
append
appendArray
takeFirst
takeLast
fillWith()

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
  new(sizeMax: number): IList<T>;
}

export {
  IList,
  IListStatic
};
