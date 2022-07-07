import {getPropertiesOf, Field} from '..';

class Mask {
  static componentName = 'Mask';
}

class Style {
  @Field({type: 'color'})
  colors: string[];
}

class Text {
  static componentName = 'Text';

  @Field({type: 'vector2'})
  mask: {x: number; y: number};

  @Field(() => Style)
  style: Style[];
}

describe('test @Field', () => {
  it('should get componentName', () => {
    const data = getPropertiesOf(Mask);
    expect(data.name).toBe('Mask');
    expect(data.type).toBe('Mask');
  });

  it('should get fields', () => {
    const data = getPropertiesOf(Text);
    expect(data.children[0].type).toBe('vector2');
    expect(data.children[0].name).toBe('mask');

    expect(data.children[1].type).toBe('object');
    expect(data.children[1].name).toBe('style');
    expect(data.children[1].isArray).toBe(true);
    expect(data.children[1].addable).toBe(true);
    expect(data.children[1].children[0].type).toBe('color');
    expect(data.children[1].children[0].isArray).toBe(true);
    expect(data.children[1].children[0].name).toBe('colors');
    expect(data.children[1].children[0].addable).toBe(true);
  });
});
