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
var __runInitializers =
  (this && this.__runInitializers) ||
  function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
      value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
  };
var __esDecorate =
  (this && this.__esDecorate) ||
  function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) {
      if (f !== void 0 && typeof f !== 'function') throw new TypeError('Function expected');
      return f;
    }
    var kind = contextIn.kind,
      key = kind === 'getter' ? 'get' : kind === 'setter' ? 'set' : 'value';
    var target = !descriptorIn && ctor ? (contextIn['static'] ? ctor : ctor.prototype) : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _,
      done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
      var context = {};
      for (var p in contextIn) context[p] = p === 'access' ? {} : contextIn[p];
      for (var p in contextIn.access) context.access[p] = contextIn.access[p];
      context.addInitializer = function (f) {
        if (done) throw new TypeError('Cannot add initializers after decoration has completed');
        extraInitializers.push(accept(f || null));
      };
      var result = (0, decorators[i])(kind === 'accessor' ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
      if (kind === 'accessor') {
        if (result === void 0) continue;
        if (result === null || typeof result !== 'object') throw new TypeError('Object expected');
        if ((_ = accept(result.get))) descriptor.get = _;
        if ((_ = accept(result.set))) descriptor.set = _;
        if ((_ = accept(result.init))) initializers.unshift(_);
      } else if ((_ = accept(result))) {
        if (kind === 'field') initializers.unshift(_);
        else descriptor[key] = _;
      }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
  };
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create((typeof Iterator === 'function' ? Iterator : Object).prototype);
    return (
      (g.next = verb(0)),
      (g['throw'] = verb(1)),
      (g['return'] = verb(2)),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y && (t = op[0] & 2 ? y['return'] : op[0] ? y['throw'] || ((t = y['return']) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!((t = _.trys), (t = t.length > 0 && t[t.length - 1])) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
var __setFunctionName =
  (this && this.__setFunctionName) ||
  function (f, name, prefix) {
    if (typeof name === 'symbol') name = name.description ? '['.concat(name.description, ']') : '';
    return Object.defineProperty(f, 'name', { configurable: true, value: prefix ? ''.concat(prefix, ' ', name) : name });
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.JobSyncerManager = void 0;
var mc_priority_queue_1 = require('@map-colonies/mc-priority-queue');
var tsyringe_1 = require('tsyringe');
var api_1 = require('@opentelemetry/api');
var conventions_1 = require('@map-colonies/telemetry/conventions');
var telemetry_1 = require('@map-colonies/telemetry');
var constants_1 = require('../common/constants');
var JobSyncerManager = (function () {
  var _classDecorators = [(0, tsyringe_1.injectable)()];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var _instanceExtraInitializers = [];
  var _progressJobs_decorators;
  var _handleDeleteJob_decorators;
  var _handleIngestionJob_decorators;
  var _getInProgressJobs_decorators;
  var _handleUpdateJob_decorators;
  var _handleUpdateJobRejection_decorators;
  var JobSyncerManager = (_classThis = /** @class */ (function () {
    function JobSyncerManager_1(logger, tracer, config, jobManagerClient, catalogManagerClient) {
      this.logger = (__runInitializers(this, _instanceExtraInitializers), logger);
      this.tracer = tracer;
      this.config = config;
      this.jobManagerClient = jobManagerClient;
      this.catalogManagerClient = catalogManagerClient;
      this.logContext = {
        fileName: __filename,
        class: JobSyncerManager.name,
      };
    }
    JobSyncerManager_1.prototype.progressJobs = function (jobs) {
      return __awaiter(this, void 0, void 0, function () {
        var logContext, _i, jobs_1, job, spanActive;
        var _a, _b;
        return __generator(this, function (_c) {
          switch (_c.label) {
            case 0:
              logContext = __assign(__assign({}, this.logContext), { function: this.progressJobs.name });
              ((_i = 0), (jobs_1 = jobs));
              _c.label = 1;
            case 1:
              if (!(_i < jobs_1.length)) return [3 /*break*/, 7];
              job = jobs_1[_i];
              spanActive = api_1.trace.getActiveSpan();
              spanActive === null || spanActive === void 0
                ? void 0
                : spanActive.setAttributes(
                    ((_a = {}),
                    (_a[conventions_1.INFRA_CONVENTIONS.infra.jobManagement.jobId] = job.id),
                    (_a[conventions_1.INFRA_CONVENTIONS.infra.jobManagement.jobType] = job.type),
                    (_a[conventions_1.THREE_D_CONVENTIONS.three_d.catalogManager.catalogId] = job.resourceId),
                    _a)
                  );
              if (!(job.type == constants_1.INGESTION_JOB_TYPE)) return [3 /*break*/, 3];
              return [4 /*yield*/, this.handleIngestionJob(job)];
            case 2:
              _c.sent();
              return [3 /*break*/, 6];
            case 3:
              if (!(job.type == constants_1.DELETE_JOB_TYPE)) return [3 /*break*/, 5];
              return [4 /*yield*/, this.handleDeleteJob(job)];
            case 4:
              _c.sent();
              return [3 /*break*/, 6];
            case 5:
              this.logger.error(
                ((_b = {
                  msg: 'Job: '.concat(job.id, ' has unsupported Type ').concat(job.type),
                  logContext: logContext,
                }),
                (_b[conventions_1.INFRA_CONVENTIONS.infra.jobManagement.jobId] = job.id),
                _b)
              );
              _c.label = 6;
            case 6:
              _i++;
              return [3 /*break*/, 1];
            case 7:
              return [2 /*return*/];
          }
        });
      });
    };
    JobSyncerManager_1.prototype.handleDeleteJob = function (job) {
      return __awaiter(this, void 0, void 0, function () {
        var logContext, isJobCompleted, records, jobPayload, err_1;
        var _a, _b, _c;
        return __generator(this, function (_d) {
          switch (_d.label) {
            case 0:
              logContext = __assign(__assign({}, this.logContext), { function: this.handleDeleteJob.name });
              isJobCompleted = job.completedTasks === job.taskCount;
              if (!isJobCompleted) return [3 /*break*/, 8];
              _d.label = 1;
            case 1:
              _d.trys.push([1, 7, , 8]);
              return [4 /*yield*/, this.catalogManagerClient.findRecords({ id: job.parameters.modelId })];
            case 2:
              records = _d.sent();
              if (!Array.isArray(records)) return [3 /*break*/, 5];
              if (!(records.length == 0)) return [3 /*break*/, 3];
              this.logger.warn(
                ((_a = {
                  msg: "didn't found a record with id ".concat(job.parameters.modelId, ' after delete task was finished'),
                  logContext: logContext,
                }),
                (_a[conventions_1.INFRA_CONVENTIONS.infra.jobManagement.jobId] = job.id),
                (_a[conventions_1.INFRA_CONVENTIONS.infra.jobManagement.jobType] = constants_1.DELETE_JOB_TYPE),
                (_a[conventions_1.THREE_D_CONVENTIONS.three_d.catalogManager.catalogId] = job.resourceId),
                _a)
              );
              return [3 /*break*/, 5];
            case 3:
              if (records.length > 1) {
                this.logger.warn(
                  ((_b = {
                    msg: 'found more than one record with id '.concat(job.parameters.modelId, ' after delete task was finished'),
                    logContext: logContext,
                  }),
                  (_b[conventions_1.INFRA_CONVENTIONS.infra.jobManagement.jobId] = job.id),
                  (_b[conventions_1.INFRA_CONVENTIONS.infra.jobManagement.jobType] = constants_1.DELETE_JOB_TYPE),
                  (_b[conventions_1.THREE_D_CONVENTIONS.three_d.catalogManager.catalogId] = job.resourceId),
                  _b)
                );
              }
              return [4 /*yield*/, this.catalogManagerClient.deleteCatalogMetadata(job.parameters.modelId)];
            case 4:
              _d.sent();
              _d.label = 5;
            case 5:
              jobPayload = this.buildJobPayload(job, mc_priority_queue_1.OperationStatus.COMPLETED, null);
              return [4 /*yield*/, this.jobManagerClient.updateJob(job.id, jobPayload)];
            case 6:
              _d.sent();
              return [3 /*break*/, 8];
            case 7:
              err_1 = _d.sent();
              this.logger.error(
                ((_c = {
                  msg: 'failed to finish delete job with id '.concat(job.parameters.modelId),
                  err: err_1,
                  logContext: logContext,
                }),
                (_c[conventions_1.INFRA_CONVENTIONS.infra.jobManagement.jobId] = job.id),
                (_c[conventions_1.INFRA_CONVENTIONS.infra.jobManagement.jobType] = job.type),
                (_c[conventions_1.THREE_D_CONVENTIONS.three_d.catalogManager.catalogId] = job.resourceId),
                _c)
              );
              return [3 /*break*/, 8];
            case 8:
              return [2 /*return*/];
          }
        });
      });
    };
    JobSyncerManager_1.prototype.handleIngestionJob = function (job) {
      return __awaiter(this, void 0, void 0, function () {
        var logContext,
          catalogMetadata,
          reason,
          isCreateCatalogSuccess,
          isJobCompleted,
          jobDataWithParameters,
          jobParameters,
          err_2,
          status,
          jobPayload,
          error_1;
        var _a, _b, _c;
        return __generator(this, function (_d) {
          switch (_d.label) {
            case 0:
              logContext = __assign(__assign({}, this.logContext), { function: this.handleIngestionJob.name });
              catalogMetadata = null;
              reason = null;
              isCreateCatalogSuccess = true;
              isJobCompleted = job.completedTasks === job.taskCount;
              _d.label = 1;
            case 1:
              _d.trys.push([1, 5, , 6]);
              if (!isJobCompleted) return [3 /*break*/, 4];
              return [4 /*yield*/, this.jobManagerClient.getJob(job.id, false)];
            case 2:
              jobDataWithParameters = _d.sent();
              jobParameters = jobDataWithParameters.parameters;
              return [4 /*yield*/, this.catalogManagerClient.createCatalogMetadata(jobParameters)];
            case 3:
              catalogMetadata = _d.sent();
              this.logger.info(
                ((_a = {
                  msg: 'Job: '.concat(job.id, ' is completed'),
                  logContext: logContext,
                  modelId: jobParameters.modelId,
                  modelName: jobParameters.metadata.productName,
                }),
                (_a[conventions_1.INFRA_CONVENTIONS.infra.jobManagement.jobId] = job.id),
                (_a[conventions_1.INFRA_CONVENTIONS.infra.jobManagement.jobType] = job.type),
                (_a[conventions_1.THREE_D_CONVENTIONS.three_d.catalogManager.catalogId] = job.resourceId),
                _a)
              );
              _d.label = 4;
            case 4:
              return [3 /*break*/, 6];
            case 5:
              err_2 = _d.sent();
              this.logger.error(
                ((_b = {
                  err: err_2,
                  logContext: logContext,
                }),
                (_b[conventions_1.INFRA_CONVENTIONS.infra.jobManagement.jobId] = job.id),
                (_b[conventions_1.INFRA_CONVENTIONS.infra.jobManagement.jobType] = job.type),
                (_b[conventions_1.THREE_D_CONVENTIONS.three_d.catalogManager.catalogId] = job.resourceId),
                _b)
              );
              isCreateCatalogSuccess = false;
              reason = err_2.message;
              return [3 /*break*/, 6];
            case 6:
              status = this.getStatus(job, isJobCompleted, isCreateCatalogSuccess);
              jobPayload = this.buildJobPayload(job, status, reason);
              _d.label = 7;
            case 7:
              _d.trys.push([7, 9, , 11]);
              return [4 /*yield*/, this.handleUpdateJob(job.id, jobPayload)];
            case 8:
              _d.sent();
              return [3 /*break*/, 11];
            case 9:
              error_1 = _d.sent();
              return [4 /*yield*/, this.handleUpdateJobRejection(error_1, catalogMetadata)];
            case 10:
              _d.sent();
              return [3 /*break*/, 11];
            case 11:
              this.logger.debug(
                ((_c = {
                  msg: 'Finished job syncer',
                  logContext: logContext,
                }),
                (_c[conventions_1.INFRA_CONVENTIONS.infra.jobManagement.jobId] = job.id),
                (_c[conventions_1.INFRA_CONVENTIONS.infra.jobManagement.jobType] = constants_1.INGESTION_JOB_TYPE),
                (_c[conventions_1.THREE_D_CONVENTIONS.three_d.catalogManager.catalogId] = job.resourceId),
                (_c.payload = jobPayload),
                _c)
              );
              return [2 /*return*/];
          }
        });
      });
    };
    JobSyncerManager_1.prototype.getInProgressJobs = function () {
      return __awaiter(this, void 0, void 0, function () {
        var logContext, findJobsBody, jobs;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              logContext = __assign(__assign({}, this.logContext), { function: this.getInProgressJobs.name });
              findJobsBody = {
                statuses: [mc_priority_queue_1.OperationStatus.IN_PROGRESS],
                types: [constants_1.INGESTION_JOB_TYPE, constants_1.DELETE_JOB_TYPE],
                shouldReturnTasks: false,
                shouldReturnAvailableActions: false,
              };
              this.logger.debug({
                msg: 'Starting getInProgressJobs',
                logContext: logContext,
                queryParams: findJobsBody,
              });
              return [4 /*yield*/, this.jobManagerClient.findJobs(findJobsBody)];
            case 1:
              jobs = _a.sent();
              this.logger.debug({
                msg: 'Finishing getInProgressJobs',
                logContext: logContext,
                count: jobs.length,
              });
              return [2 /*return*/, jobs];
          }
        });
      });
    };
    JobSyncerManager_1.prototype.handleUpdateJob = function (jobId, payload) {
      return __awaiter(this, void 0, void 0, function () {
        var logContext;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              logContext = __assign(__assign({}, this.logContext), { function: this.handleUpdateJob.name });
              this.logger.debug({
                msg: 'Starting updateJob',
                logContext: logContext,
                jobId: jobId,
              });
              return [4 /*yield*/, this.jobManagerClient.updateJob(jobId, payload)];
            case 1:
              _a.sent();
              this.logger.debug({
                msg: 'Done updateJob',
                logContext: logContext,
                jobId: jobId,
              });
              return [2 /*return*/];
          }
        });
      });
    };
    JobSyncerManager_1.prototype.handleUpdateJobRejection = function (err, catalogMetadata) {
      return __awaiter(this, void 0, void 0, function () {
        var logContext;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              logContext = __assign(__assign({}, this.logContext), { function: this.handleUpdateJobRejection.name });
              if (!((catalogMetadata === null || catalogMetadata === void 0 ? void 0 : catalogMetadata.id) !== undefined)) return [3 /*break*/, 2];
              return [4 /*yield*/, this.catalogManagerClient.deleteCatalogMetadata(catalogMetadata.id)];
            case 1:
              _a.sent();
              _a.label = 2;
            case 2:
              if (err instanceof Error) {
                this.logger.error({
                  err: err,
                  logContext: logContext,
                  msg: 'Failed to updateJob',
                  stack: err.stack,
                });
                throw err;
              }
              return [2 /*return*/];
          }
        });
      });
    };
    JobSyncerManager_1.prototype.handleInProgressJobs = function () {
      return __awaiter(this, void 0, void 0, function () {
        var logContext, jobs;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              logContext = __assign(__assign({}, this.logContext), { function: this.handleInProgressJobs.name });
              this.logger.debug({
                msg: 'Getting In-Progress jobs',
                logContext: logContext,
              });
              return [4 /*yield*/, this.getInProgressJobs()];
            case 1:
              jobs = _a.sent();
              if (!(Array.isArray(jobs) && jobs.length > 0)) return [3 /*break*/, 3];
              return [4 /*yield*/, this.progressJobs(jobs)];
            case 2:
              _a.sent();
              return [2 /*return*/, true];
            case 3:
              return [2 /*return*/, false];
          }
        });
      });
    };
    JobSyncerManager_1.prototype.buildJobPayload = function (job, status, reason) {
      var payload = {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        percentage: parseInt(((job.completedTasks / job.taskCount) * 100).toString()),
        status: status,
      };
      if (reason !== null) {
        payload.reason = reason;
      }
      return payload;
    };
    JobSyncerManager_1.prototype.getStatus = function (job, isJobCompleted, isCreateCatalogSuccess) {
      var isJobNeedToFail = job.failedTasks > 0 && job.inProgressTasks === 0 && job.pendingTasks === 0;
      if (!isCreateCatalogSuccess || isJobNeedToFail) {
        return mc_priority_queue_1.OperationStatus.FAILED;
      }
      if (isJobCompleted) {
        return mc_priority_queue_1.OperationStatus.COMPLETED;
      }
      return mc_priority_queue_1.OperationStatus.IN_PROGRESS;
    };
    return JobSyncerManager_1;
  })());
  __setFunctionName(_classThis, 'JobSyncerManager');
  (function () {
    var _metadata = typeof Symbol === 'function' && Symbol.metadata ? Object.create(null) : void 0;
    _progressJobs_decorators = [telemetry_1.withSpanAsync];
    _handleDeleteJob_decorators = [telemetry_1.withSpanAsync];
    _handleIngestionJob_decorators = [telemetry_1.withSpanAsync];
    _getInProgressJobs_decorators = [telemetry_1.withSpanAsync];
    _handleUpdateJob_decorators = [telemetry_1.withSpanAsync];
    _handleUpdateJobRejection_decorators = [telemetry_1.withSpanAsync];
    __esDecorate(
      _classThis,
      null,
      _progressJobs_decorators,
      {
        kind: 'method',
        name: 'progressJobs',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'progressJobs' in obj;
          },
          get: function (obj) {
            return obj.progressJobs;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers
    );
    __esDecorate(
      _classThis,
      null,
      _handleDeleteJob_decorators,
      {
        kind: 'method',
        name: 'handleDeleteJob',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'handleDeleteJob' in obj;
          },
          get: function (obj) {
            return obj.handleDeleteJob;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers
    );
    __esDecorate(
      _classThis,
      null,
      _handleIngestionJob_decorators,
      {
        kind: 'method',
        name: 'handleIngestionJob',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'handleIngestionJob' in obj;
          },
          get: function (obj) {
            return obj.handleIngestionJob;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers
    );
    __esDecorate(
      _classThis,
      null,
      _getInProgressJobs_decorators,
      {
        kind: 'method',
        name: 'getInProgressJobs',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'getInProgressJobs' in obj;
          },
          get: function (obj) {
            return obj.getInProgressJobs;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers
    );
    __esDecorate(
      _classThis,
      null,
      _handleUpdateJob_decorators,
      {
        kind: 'method',
        name: 'handleUpdateJob',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'handleUpdateJob' in obj;
          },
          get: function (obj) {
            return obj.handleUpdateJob;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers
    );
    __esDecorate(
      _classThis,
      null,
      _handleUpdateJobRejection_decorators,
      {
        kind: 'method',
        name: 'handleUpdateJobRejection',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'handleUpdateJobRejection' in obj;
          },
          get: function (obj) {
            return obj.handleUpdateJobRejection;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers
    );
    __esDecorate(
      null,
      (_classDescriptor = { value: _classThis }),
      _classDecorators,
      { kind: 'class', name: _classThis.name, metadata: _metadata },
      null,
      _classExtraInitializers
    );
    JobSyncerManager = _classThis = _classDescriptor.value;
    if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (JobSyncerManager = _classThis);
})();
exports.JobSyncerManager = JobSyncerManager;
