'use strict';
var _a, _b;
Object.defineProperty(exports, '__esModule', { value: true });
exports.SERVICES =
  exports.DELETE_JOB_TYPE =
  exports.INGESTION_JOB_TYPE =
  exports.NODE_VERSION =
  exports.SERVICE_VERSION =
  exports.SERVICE_NAME =
  exports.IGNORED_INCOMING_TRACE_ROUTES =
  exports.IGNORED_OUTGOING_TRACE_ROUTES =
    void 0;
var config_1 = require('config');
var read_pkg_1 = require('@map-colonies/read-pkg');
exports.IGNORED_OUTGOING_TRACE_ROUTES = [/^.*\/v1\/metrics.*$/];
exports.IGNORED_INCOMING_TRACE_ROUTES = [/^.*\/docs.*$/];
var packageJsonData = (0, read_pkg_1.readPackageJsonSync)();
exports.SERVICE_NAME = (_a = packageJsonData.name) !== null && _a !== void 0 ? _a : 'unknown_service';
exports.SERVICE_VERSION = (_b = packageJsonData.version) !== null && _b !== void 0 ? _b : 'unknown_version';
exports.NODE_VERSION = process.versions.node;
exports.INGESTION_JOB_TYPE = config_1.default.get('jobManager.ingestion.jobType');
exports.DELETE_JOB_TYPE = config_1.default.get('jobManager.delete.jobType');
/* eslint-disable @typescript-eslint/naming-convention */
exports.SERVICES = {
  LOGGER: Symbol('Logger'),
  CONFIG: Symbol('Config'),
  TRACER: Symbol('Tracer'),
  JOB_MANAGER_CLIENT: Symbol('JobManagerClient'),
  JOB_SYNCER_MANAGER: Symbol('JobSyncerManager'),
  CATALOG_MANAGER: Symbol('CatalogManager'),
};
/* eslint-enable @typescript-eslint/naming-convention */
