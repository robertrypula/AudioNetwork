// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

interface IList<T> {
  clone(): IList<T>;
  append(value: T): boolean;
  setSizeMax(sizeMax: number): void;
  getSizeMax(): number;
}

interface IListStatic<T> {
  new(sizeMax: number): IList<T>;
}

export {
  IList,
  IListStatic
};
