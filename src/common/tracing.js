'use strict';
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
Object.defineProperty(exports, '__esModule', { value: true });
exports.tracingFactory = tracingFactory;
exports.getTracing = getTracing;
var telemetry_1 = require('@map-colonies/telemetry');
var constants_1 = require('./constants');
var tracing;
function tracingFactory(options) {
  tracing = new telemetry_1.Tracing(
    __assign(__assign({}, options), {
      autoInstrumentationsConfigMap: {
        '@opentelemetry/instrumentation-http': {
          ignoreIncomingRequestHook: function (request) {
            return constants_1.IGNORED_INCOMING_TRACE_ROUTES.some(function (route) {
              return request.url !== undefined && route.test(request.url);
            });
          },
          ignoreOutgoingRequestHook: function (request) {
            return constants_1.IGNORED_OUTGOING_TRACE_ROUTES.some(function (route) {
              return typeof request.path === 'string' && route.test(request.path);
            });
          },
        },
        '@opentelemetry/instrumentation-fs': {
          requireParentSpan: true,
        },
      },
    })
  );
  return tracing;
}
function getTracing() {
  if (!tracing) {
    throw new Error('tracing not initialized');
  }
  return tracing;
}
