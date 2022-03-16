import {getPropertiesOf, Field} from '..';

class Option {
  @Field({step: 1, min: 1, max: 100})
  a: number;
}

class Resource {
  static getProperties() {
    return 'resource';
  }
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

describe('should Field works', () => {
  test('should attach basic types', () => {
    const attrs = getPropertiesOf(Test);
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
});
