import jsLogger, { LoggerOptions } from '@map-colonies/js-logger';
import config from 'config';
import { logMethod } from '@map-colonies/telemetry';
import { trace } from '@opentelemetry/api';
import { Registry } from 'prom-client';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import { JobManagerClient } from '@map-colonies/mc-priority-queue';
import { SERVICES, SERVICE_NAME } from './common/constants';
import { InjectionObject, registerDependencies } from './common/dependencyRegistration';
import { JobManagerConfig } from './jobSyncerManager/interfaces';
import { JobSyncerManager } from './jobSyncerManager/jobSyncer';
import { CatalogManager } from './catalogManager/catalogManager';
import { getConfig } from './common/config';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = (options?: RegisterOptions): DependencyContainer => {
  const loggerConfig = config.get<LoggerOptions>('telemetry.logger');
  const logger = jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, hooks: { logMethod } });
  const jobConfig: JobManagerConfig = config.get<JobManagerConfig>('jobManager');

  const tracer = trace.getTracer(SERVICE_NAME);

  const configInstance = getConfig();
  const metricsRegistry = new Registry();
  configInstance.initializeMetrics(metricsRegistry);

  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: config } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },
    { token: SERVICES.TRACER, provider: { useValue: tracer } },
    { token: SERVICES.METRICS, provider: { useValue: metricsRegistry } },
    { token: SERVICES.JOB_MANAGER_CLIENT, provider: { useFactory: () => new JobManagerClient(logger, jobConfig.url) } },
    { token: SERVICES.JOB_SYNCER_MANAGER, provider: { useClass: JobSyncerManager } },
    { token: SERVICES.CATALOG_MANAGER, provider: { useClass: CatalogManager } },
  ];

  return registerDependencies(dependencies, options?.override, options?.useChild);
};
