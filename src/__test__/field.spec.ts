import {getPropertiesOf, Field, FieldMetadata, ExecuteInEditMode, shouldExecuteInEditMode} from '..';

function isFunction(val: unknown): val is Function {
  return typeof val === 'function';
}

function isObject(val: unknown): val is object {
  return typeof val === 'object';
}
class Option {
  @Field({step: 1, min: 1, max: 100})
  a: number;
}

class Resource {
  static getProperties(): FieldMetadata<Resource> {
    return 'resource';
  }
}

class DynamicProperties {
  // eslint-disable-next-line
  constructor(protected type: string) {
    //
  }

  public x!: string;
  public y?: string;

  static getProperties(): (target: any) => FieldMetadata<DynamicProperties> {
    return target => {
      if (target.type === 'base') {
        return {x: {type: 'string', isArray: false}, y: {type: 'string', isArray: false}};
      } else {
        return {x: {type: 'string', isArray: false}};
      }
    };
  }
}

class NestDynamicProperties {
  @Field(() => DynamicProperties)
  dyn: DynamicProperties;
}

class Vector2 {
  @Field()
  x: number;
  @Field()
  y: number;
}

class Vector3 extends Vector2 {
  @Field()
  z: number;
}

class VectorOverride extends Vector2 {
  @Field({step: 1})
  z: number;
}

class Position {
  x!: string;
  y!: string;

  static getProperties() {
    return {x: 'string', y: 'string'};
  }
}

class Test {
  @Field()
  bool: boolean;

  @Field()
  num: number;

  @Field()
  str: string;

  @Field(() => [Number])
  arrNums: number[];

  @Field(() => Number)
  arrNums2: number[];

  @Field()
  option: Option;

  @Field(() => Resource)
  resource: string;

  @Field(() => Position)
  position: Position;
}

class Renderer3D {
  @Field(() => Vector3)
  position3: Vector3;
}

class Override {
  @Field(() => VectorOverride)
  position3: VectorOverride;
}

class OverrideType {
  @Field({type: 'textarea'})
  text: string;
}

class ReturnTypeArray {
  @Field(() => [Number])
  nums: number[] | number | string | string[];
}

class AnyField {
  @Field({bool: true})
  test: string;
}

const intFilter = (val: any) => {
  let num = 0;
  if (typeof val === 'number') {
    num = val;
  } else if (typeof val === 'string') {
    let maybeNumber = Number(val);
    if (isNaN(maybeNumber)) {
      return 0;
    }
    num = maybeNumber;
  }
  return Math.round(num);
};

const addOneFilter = (val: number): number => {
  return val + 1;
};

class Filter {
  @Field({
    filter: intFilter,
  })
  int: number;

  @Field({
    filters: [intFilter, addOneFilter],
  })
  int2: number;
}

@ExecuteInEditMode
class ExecuteInEdit {}

describe('should Field works', () => {
  test('should attach basic types', () => {
    const attrs = getPropertiesOf(Test);
    expect(isObject(attrs)).toBe(true);
    expect(attrs.bool.type).toBe('boolean');
    expect(attrs.bool.isArray).toBe(false);
    expect(attrs.num.type).toBe('number');
    expect(attrs.num.isArray).toBe(false);
    expect(attrs.str.type).toBe('string');
    expect(attrs.str.isArray).toBe(false);
    expect(attrs.arrNums.type).toBe('number');
    expect(attrs.arrNums.isArray).toBe(true);
    expect(attrs.arrNums2.type).toBe('number');
    expect(attrs.arrNums2.isArray).toBe(true);
  });
  test('should attach field options', () => {
    const attrs = getPropertiesOf(Option);
    expect(attrs.a.type).toBe('number');
    expect(attrs.a.isArray).toBe(false);
    expect(attrs.a.step).toBe(1);
    expect(attrs.a.min).toBe(1);
    expect(attrs.a.max).toBe(100);
  });

  test('should nested', () => {
    const attrs = getPropertiesOf(Test);
    expect(attrs.option.type.a.isArray).toBe(false);
    expect(attrs.option.type.a.max).toBe(100);
    expect(attrs.option.type.a.min).toBe(1);
    expect(attrs.option.type.a.step).toBe(1);
    expect(attrs.option.isArray).toBe(false);
  });

  test('should getProperties works', () => {
    const attrs = getPropertiesOf(Test);
    expect(attrs.resource.type).toBe('resource');

    expect(attrs.position.type.x).toBe('string');
    expect(attrs.position.type.y).toBe('string');
  });

  test('should support inherit', () => {
    const attrs = getPropertiesOf(Renderer3D);
    expect(attrs.position3.type.x.type).toBe('number');
    expect(attrs.position3.type.y.type).toBe('number');
    expect(attrs.position3.type.z.type).toBe('number');
  });
  test('should support override', () => {
    const attrs = getPropertiesOf(Override);
    expect(attrs.position3.type.x.type).toBe('number');
    expect(attrs.position3.type.y.type).toBe('number');
    expect(attrs.position3.type.z.type).toBe('number');
    expect(attrs.position3.type.z.step).toBe(1);
  });

  test('should support dynamic properties', () => {
    const getAttrsFunc = getPropertiesOf(DynamicProperties);
    expect(isFunction(getAttrsFunc)).toBe(true);
    const d1 = new DynamicProperties('basic');
    const d2 = new DynamicProperties('base');
    const attrs1 = getAttrsFunc(d1);
    const attrs2 = getAttrsFunc(d2);

    expect(attrs1.x.type).toBe('string');
    expect(attrs1.y).toBe(undefined);

    expect(attrs2.x.type).toBe('string');
    expect(attrs2.y.type).toBe('string');
  });

  test('should nested dynamic properties', () => {
    const attrs = getPropertiesOf(NestDynamicProperties);
    const dyn = new DynamicProperties('basic');
    expect(typeof attrs.dyn.type).toBe('function');
    const data = (attrs.dyn.type as any)(dyn);
    expect(data.x.type).toBe('string');
    expect(data.y).toBe(undefined);
    const dyn2 = new DynamicProperties('base');
    const data2 = (attrs.dyn.type as any)(dyn2);
    expect(data2.x.type).toBe('string');
    expect(data2.y.type).toBe('string');
  });

  test('should override type', () => {
    const attrs = getPropertiesOf(OverrideType);
    expect(attrs.text.type).toBe('textarea');
  });

  test('should support return type array', () => {
    const attrs = getPropertiesOf(ReturnTypeArray);
    expect(attrs.nums.isArray).toBe(true);
    expect(attrs.nums.type).toBe('number');
  });

  test('should support any field options', () => {
    const attrs = getPropertiesOf(AnyField);
    expect(attrs.test.bool).toBe(true);
    expect(attrs.test.type).toBe('string');
  });

  test('should support filter', () => {
    const attrs = getPropertiesOf(Filter);
    expect(attrs.int.type).toBe('number');
    const filterFn = attrs.int.filter;
    expect(isFunction(filterFn)).toBe(true);
    expect(filterFn('test')).toBe(0);
    expect(filterFn(1.1)).toBe(1);
    expect(filterFn(1.9)).toBe(2);

    expect(attrs.int2.type).toBe('number');
    const filters = attrs.int2.filters;
    expect(Array.isArray(filters)).toBe(true);
    const filterBatch = (val: any) => filters.reduce((prev, fn) => fn(prev), val);
    expect(filterBatch('test')).toBe(1);
    expect(filterBatch(1.1)).toBe(2);
    expect(filterBatch(1.9)).toBe(3);
  });

  test('should execute in editor', () => {
    expect(shouldExecuteInEditMode(ExecuteInEdit)).toBe(true);
    expect(shouldExecuteInEditMode(Vector2)).toBe(false);
  });
});
