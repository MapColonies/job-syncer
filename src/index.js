'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
require('reflect-metadata');
var app_1 = require('./app');
function main() {
  var app = (0, app_1.getApp)();
  app
    .run()
    .then()
    .catch(function (error) {
      console.error(error);
    });
}
void main();
