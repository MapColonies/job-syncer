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
var __runInitializers =
  (this && this.__runInitializers) ||
  function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
      value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
exports.App = void 0;
exports.getApp = getApp;
var promises_1 = require('timers/promises');
var tsyringe_1 = require('tsyringe');
var express_1 = require('express');
var http_status_codes_1 = require('http-status-codes');
var containerConfig_1 = require('./containerConfig');
var prom_metrics_1 = require('@map-colonies/telemetry/prom-metrics');
var App = (function () {
  var _classDecorators = [(0, tsyringe_1.singleton)()];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var App = (_classThis = /** @class */ (function () {
    function App_1(logger, config, jobSyncerManager, metricsRegistry) {
      this.logger = logger;
      this.config = config;
      this.jobSyncerManager = jobSyncerManager;
      this.metricsRegistry = metricsRegistry;
      this.intervalMs = this.config.get('jobSyncer.intervalMs');
      this.port = this.config.get('server.port');
      this.serverInstance = (0, express_1.default)();
      if (this.metricsRegistry) {
        this.serverInstance.use((0, prom_metrics_1.collectMetricsExpressMiddleware)({ registry: this.metricsRegistry, collectNodeMetrics: true }));
      }
      this.serverInstance.get('/liveness', function (req, res) {
        res.status(http_status_codes_1.StatusCodes.OK).send('OK');
      });
      this.logContext = {
        fileName: __filename,
        class: App.name,
      };
    }
    App_1.prototype.run = function () {
      return __awaiter(this, void 0, void 0, function () {
        var logContext;
        var _this = this;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              logContext = __assign(__assign({}, this.logContext), { function: this.run.name });
              this.logger.info({
                msg: 'Starting jobSyncer',
                logContext: logContext,
              });
              this.serverInstance.listen(this.port, function () {
                _this.logger.info({
                  msg: 'app started on port '.concat(_this.port),
                  logContext: logContext,
                });
              });
              return [4 /*yield*/, this.mainLoop()];
            case 1:
              _a.sent();
              return [2 /*return*/];
          }
        });
      });
    };
    App_1.prototype.mainLoop = function () {
      return __awaiter(this, void 0, void 0, function () {
        var isRunning, err_1;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              isRunning = true;
              _a.label = 1;
            case 1:
              if (!isRunning) return [3 /*break*/, 8];
              _a.label = 2;
            case 2:
              _a.trys.push([2, 5, , 7]);
              return [4 /*yield*/, this.jobSyncerManager.handleInProgressJobs()];
            case 3:
              _a.sent();
              return [4 /*yield*/, (0, promises_1.setTimeout)(this.intervalMs)];
            case 4:
              _a.sent();
              return [3 /*break*/, 7];
            case 5:
              err_1 = _a.sent();
              this.logger.error({
                msg: 'mainLoop: Error: '.concat(JSON.stringify(err_1, Object.getOwnPropertyNames(err_1))),
                err: err_1,
              });
              return [4 /*yield*/, (0, promises_1.setTimeout)(this.intervalMs)];
            case 6:
              _a.sent();
              return [3 /*break*/, 7];
            case 7:
              return [3 /*break*/, 1];
            case 8:
              return [2 /*return*/];
          }
        });
      });
    };
    return App_1;
  })());
  __setFunctionName(_classThis, 'App');
  (function () {
    var _metadata = typeof Symbol === 'function' && Symbol.metadata ? Object.create(null) : void 0;
    __esDecorate(
      null,
      (_classDescriptor = { value: _classThis }),
      _classDecorators,
      { kind: 'class', name: _classThis.name, metadata: _metadata },
      null,
      _classExtraInitializers
    );
    App = _classThis = _classDescriptor.value;
    if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (App = _classThis);
})();
exports.App = App;
function getApp(registerOptions) {
  var container = (0, containerConfig_1.registerExternalValues)(registerOptions);
  var app = container.resolve(App);
  return app;
}
