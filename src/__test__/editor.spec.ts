import {
  Class,
  Property,
  createEditorComponentManifest,
  createEditorComponentModule,
  createRuntimeExtensions,
  getPropertiesOf,
} from '..';

class BaseComponent {}

@Class('DropSpawner')
class DropSpawner extends BaseComponent {
  static componentName = 'DropSpawner';

  @Property({type: 'enum', options: ['normal', 'super']})
  kind: 'normal' | 'super' = 'normal';

  @Property({type: 'asset', assetType: 'sprite'})
  spriteResource = 'fulu-tp';

  @Property({type: 'number', min: 0, step: 10})
  speed = 500;
}

@Class('ResultScoreText')
class ResultScoreText extends BaseComponent {
  static componentName = 'ResultScoreText';
}

describe('@eva/inspector-decorator editor manifest helpers', () => {
  it('creates editor manifest descriptors with defaults from decorated fields', () => {
    const manifest = createEditorComponentManifest({DropSpawner, ResultScoreText});

    expect(manifest).toEqual({
      version: 1,
      components: [
        expect.objectContaining({
          type: 'DropSpawner',
          label: 'Drop Spawner',
          group: 'Logic',
          addable: true,
          singleton: true,
          isRenderComponent: false,
          defaultProps: {
            kind: 'normal',
            spriteResource: 'fulu-tp',
            speed: 500,
          },
        }),
        expect.objectContaining({
          type: 'ResultScoreText',
          defaultProps: {},
          inspector: expect.objectContaining({children: []}),
        }),
      ],
    });
    expect(manifest.components[0].inspector.children).toEqual([
      expect.objectContaining({name: 'kind', type: 'string', options: ['normal', 'super']}),
      expect.objectContaining({name: 'spriteResource', type: 'string', assetType: 'sprite'}),
      expect.objectContaining({name: 'speed', type: 'number', step: 10}),
    ]);
  });

  it('stores Property metadata in the same inspector metadata source as Field', () => {
    const data = getPropertiesOf(DropSpawner);

    expect(data.children && data.children.map(child => child.name)).toEqual(['kind', 'spriteResource', 'speed']);
    expect(data.children && data.children[0]).toEqual(expect.objectContaining({type: 'enum', options: ['normal', 'super']}));
  });

  it('creates runtime component maps from the same module exports', () => {
    const extensions = createRuntimeExtensions({DropSpawner, ResultScoreText});

    expect(Object.keys(extensions.components)).toEqual(['DropSpawner', 'ResultScoreText']);
    expect(extensions.components.DropSpawner).toBe(DropSpawner);
    expect(extensions.systems).toEqual({});
  });

  it('scopes editor component modules to explicit export names', () => {
    const scoped = createEditorComponentModule({DropSpawner, ResultScoreText}, ['ResultScoreText']);
    const empty = createEditorComponentModule({DropSpawner, ResultScoreText}, []);

    expect(scoped.editorComponentManifest.components.map(component => component.type)).toEqual(['ResultScoreText']);
    expect(Object.keys(scoped.runtimeExtensions.components)).toEqual(['ResultScoreText']);
    expect(empty.editorComponentManifest.components).toEqual([]);
    expect(empty.runtimeExtensions.components).toEqual({});
  });
});
