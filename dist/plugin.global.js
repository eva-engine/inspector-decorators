this.EVA = this.EVA || {};
this.EVA.plugin = this.EVA.plugin || {};
this.EVA.plugin.demo = (function (exports) {
  'use strict';

  function helloWorld() {
      return 'hello world';
  }

  exports.helloWorld = helloWorld;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

}({}));
