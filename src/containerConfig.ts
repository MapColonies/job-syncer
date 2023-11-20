import jsLogger, { LoggerOptions } from '@map-colonies/js-logger';
import { JobManagerClient } from '@map-colonies/mc-priority-queue';
import { Metrics, getOtelMixin } from '@map-colonies/telemetry';
import { trace, metrics as OtelMetrics } from '@opentelemetry/api';
import config from 'config';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import { SERVICES, SERVICE_NAME } from './common/constants';
import { InjectionObject, registerDependencies } from './common/dependencyRegistration';
import { JobManagerConfig } from './jobSyncerManager/interfaces';
import { tracing } from './common/tracing';
import { JobSyncerManager } from './jobSyncerManager/jobSyncer';
import { CatalogManager } from './catalogManager/catalogManager';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = (options?: RegisterOptions): DependencyContainer => {
  const loggerConfig = config.get<LoggerOptions>('telemetry.logger');
  const logger = jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, mixin: getOtelMixin() });
  const jobConfig: JobManagerConfig = config.get<JobManagerConfig>('jobManager');

  const metrics = new Metrics();
  metrics.start();

  tracing.start();
  const tracer = trace.getTracer(SERVICE_NAME);

  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: config } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },
    { token: SERVICES.TRACER, provider: { useValue: tracer } },
    { token: SERVICES.METER, provider: { useValue: OtelMetrics.getMeterProvider().getMeter(SERVICE_NAME) } },
    { token: SERVICES.METRICS, provider: { useValue: metrics } },
    { token: SERVICES.JOB_MANAGER_CLIENT, provider: { useFactory: () => new JobManagerClient(logger, jobConfig.url) } },
    { token: SERVICES.JOB_SYNCER_MANAGER, provider: { useClass: JobSyncerManager } },
    { token: SERVICES.CATALOG_MANAGER, provider: { useClass: CatalogManager } },
  ];

  return registerDependencies(dependencies, options?.override, options?.useChild);
};
