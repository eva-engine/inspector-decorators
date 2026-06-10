import {IDE_PROPERTY_METADATA} from './constants';
import {Field} from './decorators';

export type EditorComponentGroup = 'Render' | 'View' | 'Interaction' | 'Animation' | 'Logic';

export type EditorPropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'color'
  | 'json'
  | 'asset'
  | 'enum'
  | 'string[]'
  | 'number[]'
  | 'boolean[]';

export interface EditorPropertyOptions {
  type?: EditorPropertyType | string;
  title?: string;
  label?: string;
  group?: string;
  default?: unknown;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  assetType?: string;
  inspector?: 'string' | 'number' | 'boolean' | 'color' | 'json' | 'asset' | 'enum';
  readonly?: boolean;
  description?: string;
}

export interface EditorClassOptions {
  name?: string;
  title?: string;
  label?: string;
  group?: EditorComponentGroup;
  addable?: boolean;
  singleton?: boolean;
  isRenderComponent?: boolean;
  description?: string;
}

export interface EditorInspectorFieldMetadata {
  name: string;
  type?: string;
  label?: string;
  group?: string;
  isArray?: boolean;
  isFolder?: boolean;
  children?: EditorInspectorFieldMetadata[];
  step?: number;
  min?: number;
  max?: number;
  options?: string[];
  assetType?: string;
  readonly?: boolean;
  description?: string;
  inspector?: string;
}

export interface EditorComponentDescriptor {
  type: string;
  label: string;
  group: EditorComponentGroup;
  addable: boolean;
  singleton: boolean;
  isRenderComponent: boolean;
  description?: string;
  defaultProps: Record<string, unknown>;
  inspector: {
    name: string;
    type: 'object';
    isArray: false;
    isFolder: true;
    children: EditorInspectorFieldMetadata[];
  };
}

export interface EditorComponentManifest {
  version: 1;
  components: EditorComponentDescriptor[];
}

export interface EditorComponentModule {
  editorComponentManifest: EditorComponentManifest;
  runtimeExtensions: {components: Record<string, unknown>; systems: Record<string, unknown>};
}

export type EditorComponentClass = {
  new (...args: any[]): Record<string, unknown>;
  componentName?: string;
  [key: string]: unknown;
};

interface StoredClassMetadata {
  type: string;
  label?: string;
  group: EditorComponentGroup;
  addable: boolean;
  singleton: boolean;
  isRenderComponent: boolean;
  description?: string;
}

interface StoredPropertyMetadata extends EditorPropertyOptions {
  key: string;
  isArray?: boolean;
  children?: EditorInspectorFieldMetadata[];
}

const EDITOR_CLASS_METADATA = 'EVA_EDITOR_CLASS_METADATA';

export function Class(typeOrOptions: string | EditorClassOptions, options: EditorClassOptions = {}): ClassDecorator {
  return target => {
    const type = typeof typeOrOptions === 'string' ? typeOrOptions : typeOrOptions.name || '';
    const resolvedOptions = typeof typeOrOptions === 'string' ? options : typeOrOptions;
    if (!type) {
      throw new Error('@Class requires a component name.');
    }

    const componentClass = target as unknown as EditorComponentClass;
    if (!componentClass.componentName) {
      componentClass.componentName = type;
    }

    Reflect.defineMetadata(
      EDITOR_CLASS_METADATA,
      {
        type,
        label: resolvedOptions.label || resolvedOptions.title,
        group: resolvedOptions.group || 'Logic',
        addable: resolvedOptions.addable !== false,
        singleton: resolvedOptions.singleton !== false,
        isRenderComponent: resolvedOptions.isRenderComponent === true,
        description: resolvedOptions.description,
      },
      target,
    );
  };
}

export function Property(options: EditorPropertyOptions = {}): PropertyDecorator {
  return Field(options);
}

export function getEditorClassMetadata(componentClass: unknown): StoredClassMetadata | undefined {
  if (!isRecord(componentClass)) {
    return undefined;
  }
  return Reflect.getMetadata(EDITOR_CLASS_METADATA, componentClass) as StoredClassMetadata | undefined;
}

export function getEditorPropertyMetadata(componentClass: unknown): StoredPropertyMetadata[] {
  if (!isRecord(componentClass)) {
    return [];
  }

  const properties = Reflect.getMetadata(IDE_PROPERTY_METADATA, componentClass) || {};
  return Object.keys(properties).map(key => ({
    key,
    ...(properties[key] as EditorPropertyOptions & {isArray?: boolean; children?: EditorInspectorFieldMetadata[]}),
  }));
}

export function createEditorComponentManifest(moduleExports: Record<string, unknown>): EditorComponentManifest {
  const components = Object.values(moduleExports)
    .map(candidate => createEditorComponentDescriptor(candidate))
    .filter((descriptor): descriptor is EditorComponentDescriptor => Boolean(descriptor));
  return {version: 1, components};
}

export function createEditorComponentModule(
  moduleExports: Record<string, unknown>,
  exportNames?: string[],
  _options: {module?: string} = {},
): EditorComponentModule {
  const scopedExports = Array.isArray(exportNames) ? pickExports(moduleExports, exportNames) : moduleExports;
  return {
    editorComponentManifest: createEditorComponentManifest(scopedExports),
    runtimeExtensions: createRuntimeExtensions(scopedExports),
  };
}

export function createRuntimeExtensions(moduleExports: Record<string, unknown>): {
  components: Record<string, unknown>;
  systems: Record<string, unknown>;
} {
  const components: Record<string, unknown> = {};
  const systems: Record<string, unknown> = {};

  Object.values(moduleExports).forEach(candidate => {
    const type = getRuntimeType(candidate);
    if (!type) {
      return;
    }
    if (type.endsWith('System')) {
      systems[type] = candidate;
    } else {
      components[type] = candidate;
    }
  });

  return {components, systems};
}

export function createEditorComponentDescriptor(candidate: unknown): EditorComponentDescriptor | undefined {
  if (typeof candidate !== 'function') {
    return undefined;
  }

  const componentClass = candidate as EditorComponentClass;
  const classMetadata = getEditorClassMetadata(componentClass);
  const type = (classMetadata && classMetadata.type) || componentClass.componentName;
  if (!type || type.endsWith('System')) {
    return undefined;
  }

  const propertyMetadata = getEditorPropertyMetadata(componentClass);
  const instance = createDefaultInstance(componentClass);
  const defaultProps: Record<string, unknown> = {};
  const children = propertyMetadata.map(property => {
    const defaultValue = Object.prototype.hasOwnProperty.call(property, 'default') ? property.default : instance && instance[property.key];
    if (defaultValue !== undefined) {
      defaultProps[property.key] = cloneJson(defaultValue);
    }
    return toInspectorField(property);
  });

  return {
    type,
    label: (classMetadata && classMetadata.label) || labelFromType(type),
    group: (classMetadata && classMetadata.group) || 'Logic',
    addable: !classMetadata || classMetadata.addable !== false,
    singleton: !classMetadata || classMetadata.singleton !== false,
    isRenderComponent: !!(classMetadata && classMetadata.isRenderComponent),
    description: classMetadata && classMetadata.description,
    defaultProps,
    inspector: {
      name: type,
      type: 'object',
      isArray: false,
      isFolder: true,
      children,
    },
  };
}

function pickExports(moduleExports: Record<string, unknown>, exportNames: string[]): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  exportNames.forEach(exportName => {
    if (Object.prototype.hasOwnProperty.call(moduleExports, exportName)) {
      output[exportName] = moduleExports[exportName];
    }
  });
  return output;
}

function getRuntimeType(candidate: unknown): string | undefined {
  if (typeof candidate !== 'function') {
    return undefined;
  }
  const componentClass = candidate as EditorComponentClass;
  const classMetadata = getEditorClassMetadata(componentClass);
  return (classMetadata && classMetadata.type) || componentClass.componentName || componentClass.name;
}

function toInspectorField(property: StoredPropertyMetadata): EditorInspectorFieldMetadata {
  const type = normalizePropertyType(property.type);
  const normalizedType = normalizeInspectorType(type, property.inspector);
  return {
    name: property.key,
    type: normalizedType,
    label: property.label || (typeof property.title === 'string' ? property.title : undefined) || labelFromType(property.key),
    group: property.group,
    isArray: property.isArray || (typeof type === 'string' && type.endsWith('[]')),
    step: property.step,
    min: property.min,
    max: property.max,
    options: property.options,
    assetType: property.assetType,
    readonly: property.readonly,
    description: property.description,
    inspector: property.inspector,
    children: property.children,
  };
}

function normalizePropertyType(type: unknown): unknown {
  if (type === String) {
    return 'string';
  }
  if (type === Number) {
    return 'number';
  }
  if (type === Boolean) {
    return 'boolean';
  }
  if (type === 'select') {
    return 'enum';
  }
  if (type === 'object') {
    return 'json';
  }
  return type;
}

function normalizeInspectorType(type: unknown, inspector: EditorPropertyOptions['inspector']): string {
  if (inspector && inspector !== 'asset' && inspector !== 'enum') {
    return inspector;
  }
  if (type === 'asset' || type === 'enum') {
    return 'string';
  }
  if (typeof type === 'string' && type.endsWith('[]')) {
    return 'json';
  }
  return typeof type === 'string' ? type : 'json';
}

function createDefaultInstance(componentClass: EditorComponentClass): Record<string, unknown> | undefined {
  try {
    return new componentClass();
  } catch (_error) {
    return undefined;
  }
}

function labelFromType(type: string): string {
  return type
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, first => first.toUpperCase());
}

function cloneJson<T>(value: T): T {
  if (value === undefined || value === null) {
    return value;
  }
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch (_error) {
    return value;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && (typeof value === 'object' || typeof value === 'function');
}
