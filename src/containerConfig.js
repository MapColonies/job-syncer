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
exports.registerExternalValues = void 0;
var js_logger_1 = require('@map-colonies/js-logger');
var config_1 = require('config');
var telemetry_1 = require('@map-colonies/telemetry');
var api_1 = require('@opentelemetry/api');
var prom_client_1 = require('prom-client');
var mc_priority_queue_1 = require('@map-colonies/mc-priority-queue');
var constants_1 = require('./common/constants');
var dependencyRegistration_1 = require('./common/dependencyRegistration');
var jobSyncer_1 = require('./jobSyncerManager/jobSyncer');
var catalogManager_1 = require('./catalogManager/catalogManager');
var config_2 = require('./common/config');
var registerExternalValues = function (options) {
  var loggerConfig = config_1.default.get('telemetry.logger');
  var logger = (0, js_logger_1.default)(
    __assign(__assign({}, loggerConfig), { prettyPrint: loggerConfig.prettyPrint, hooks: { logMethod: telemetry_1.logMethod } })
  );
  var jobConfig = config_1.default.get('jobManager');
  var tracer = api_1.trace.getTracer(constants_1.SERVICE_NAME);
  var configInstance = (0, config_2.getConfig)();
  var metricsRegistry = new prom_client_1.Registry();
  configInstance.initializeMetrics(metricsRegistry);
  var dependencies = [
    { token: constants_1.SERVICES.CONFIG, provider: { useValue: config_1.default } },
    { token: constants_1.SERVICES.LOGGER, provider: { useValue: logger } },
    { token: constants_1.SERVICES.TRACER, provider: { useValue: tracer } },
    { token: constants_1.SERVICES.METRICS, provider: { useValue: metricsRegistry } },
    {
      token: constants_1.SERVICES.JOB_MANAGER_CLIENT,
      provider: {
        useFactory: function () {
          return new mc_priority_queue_1.JobManagerClient(logger, jobConfig.url);
        },
      },
    },
    { token: constants_1.SERVICES.JOB_SYNCER_MANAGER, provider: { useClass: jobSyncer_1.JobSyncerManager } },
    { token: constants_1.SERVICES.CATALOG_MANAGER, provider: { useClass: catalogManager_1.CatalogManager } },
  ];
  return (0, dependencyRegistration_1.registerDependencies)(
    dependencies,
    options === null || options === void 0 ? void 0 : options.override,
    options === null || options === void 0 ? void 0 : options.useChild
  );
};
exports.registerExternalValues = registerExternalValues;
