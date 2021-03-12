'use strict';

if (process.env.NODE_ENV === 'production') {
  return require('./dist/plugin.cjs.prod.js');
} else {
  return require('./dist/plugin.cjs.js');
}
