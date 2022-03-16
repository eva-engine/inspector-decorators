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

// eslint-disable-next-line
export interface FieldOptions extends NumberOptions {
  //
}

export interface TypeDecoratorParams {
  returnTypeFunc?: ReturnTypeFunc;
  options: FieldOptions;
}

export interface FieldMetadataInner<T> extends NumberOptions {
  type: T extends number
    ? 'number'
    : T extends string
    ? 'string'
    : T extends boolean
    ? 'boolean'
    : T extends Record<string, any>
    ? FieldMetadata<T>
    : string;
  isArray: boolean;
}

export type FieldMetadata<T extends Record<string, any>> = {
  [K in keyof T]: FieldMetadataInner<T[K]>;
};

export type ReturnTypeAsync<T extends (...args: any) => any> = T extends (...args: any) => Promise<infer R>
  ? R
  : T extends (...args: any) => infer R
  ? R
  : any;

export type DynamicGetProperties<T extends ClassType<any>> = (target?: InstanceType<T>) => FieldMetadata<InstanceType<T>>;
export type StaticGetProperties<T extends ClassType<any>> = () => DynamicGetProperties<T> | FieldMetadata<InstanceType<T>>;
