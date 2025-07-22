'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.registerDependencies = void 0;
var tsyringe_1 = require('tsyringe');
var registerDependencies = function (dependencies, override, useChild) {
  if (useChild === void 0) {
    useChild = false;
  }
  var container = useChild ? tsyringe_1.container.createChildContainer() : tsyringe_1.container;
  dependencies.forEach(function (injectionObj) {
    var inject =
      (override === null || override === void 0
        ? void 0
        : override.find(function (overrideObj) {
            return overrideObj.token === injectionObj.token;
          })) === undefined;
    if (inject) {
      container.register(injectionObj.token, injectionObj.provider);
    }
  });
  override === null || override === void 0
    ? void 0
    : override.forEach(function (injectionObj) {
        container.register(injectionObj.token, injectionObj.provider);
      });
  return container;
};
exports.registerDependencies = registerDependencies;
