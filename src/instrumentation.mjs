var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
// This file handles the tracing initialization and starts the tracing process before the app starts.
// You should be careful about editing this file, as it is a critical part of the application's functionality.
// Because this file is a module it should imported using the `--import` flag in the `node` command, and should not be imported by any other file.
import { tracingFactory } from './common/tracing.js';
import { getConfig, initConfig } from './common/config.js';
await initConfig();
var config = getConfig();
var tracingConfig = config.get('telemetry.tracing');
var sharedConfig = config.get('telemetry.shared');
var tracing = tracingFactory(__assign(__assign({}, tracingConfig), sharedConfig));
tracing.start();
