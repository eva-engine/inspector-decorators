// eslint-disable-next-line
export interface RecursiveArray<TValue> extends Array<RecursiveArray<TValue> | TValue> {}

export interface ClassType<T = any> {
  new (...args: any): T;
}

export type TypeValue = ClassType | Function | object | symbol;
export type ReturnTypeFuncValue = TypeValue | RecursiveArray<TypeValue>;

export type TypeValueThunk = (type?: void) => TypeValue;
export type ClassTypeResolver = (of?: void) => ClassType | Function;

export type ReturnTypeFunc = (returns?: void) => ReturnTypeFuncValue;

interface NumberOptions {
  min?: number;
  max?: number;
  step?: number;
}

export interface FieldOptions extends NumberOptions, FillterOptions, FilltersOptions, AnyOptions {
  type?: string;
}

type AnyOptions = Record<string, any>;

export interface FillterOptions {
  filter?(val: any): any;
}

export interface FilltersOptions {
  filters?: ((val: any) => any)[];
}

export interface TypeDecoratorParams {
  returnTypeFunc?: ReturnTypeFunc;
  options: FieldOptions;
}

export interface FieldMetadata extends NumberOptions, FillterOptions, FilltersOptions, AnyOptions {
  name: string;
  type: string;
  children?: FieldMetadata[];
  isFolder?: boolean;
  isArray: boolean;
  addable?: boolean;
}

export type ReturnTypeAsync<T extends (...args: any) => any> = T extends (...args: any) => Promise<infer R>
  ? R
  : T extends (...args: any) => infer R
  ? R
  : any;
