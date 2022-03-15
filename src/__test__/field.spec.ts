import {getPropertiesOf, Field} from '..';

class Option {
  @Field({step: 1, min: 1, max: 100})
  a: number;
}

class Test {
  @Field()
  bool: boolean;

  @Field()
  num: number;

  @Field()
  str: string;

  @Field(() => Number)
  arrNums: number[];

  @Field()
  option: Option;
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
});
