import { Component } from '@eva/eva.js';
import { System } from '@eva/eva.js';

export declare class DemoComponent extends Component {
    static componentName: 'Demo';
    readonly name = "Demo";
}

export declare class DemoSystem extends System {
    readonly name: 'Demo';
}

export { }
