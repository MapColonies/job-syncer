import jsLogger, { LoggerOptions } from '@map-colonies/js-logger';
import config from 'config';
import { logMethod } from '@map-colonies/telemetry';
import { trace } from '@opentelemetry/api';
import { instanceCachingFactory } from 'tsyringe';
import client from 'prom-client';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import { JobManagerClient } from '@map-colonies/mc-priority-queue';
import { SERVICES, SERVICE_NAME } from './common/constants';
import { tracing } from './common/tracing';
import { InjectionObject, registerDependencies } from './common/dependencyRegistration';
import { JobManagerConfig } from './jobSyncerManager/interfaces';
import { JobSyncerManager } from './jobSyncerManager/jobSyncer';
import { CatalogManager } from './catalogManager/catalogManager';
import { IConfig } from './common/interfaces';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = (options?: RegisterOptions): DependencyContainer => {
  const loggerConfig = config.get<LoggerOptions>('telemetry.logger');
  const logger = jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, hooks: { logMethod } });
  const jobConfig: JobManagerConfig = config.get<JobManagerConfig>('jobManager');

  tracing.start();
  const tracer = trace.getTracer(SERVICE_NAME);

  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: config } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },
    { token: SERVICES.TRACER, provider: { useValue: tracer } },
    {
      token: SERVICES.METRICS_REGISTRY,
      provider: {
        useFactory: instanceCachingFactory((container) => {
          const config = container.resolve<IConfig>(SERVICES.CONFIG);

          if (config.get<boolean>('telemetry.metrics.enabled')) {
            client.register.setDefaultLabels({
              app: SERVICE_NAME,
            });
            return client.register;
          }
        }),
      },
    },
    { token: SERVICES.JOB_MANAGER_CLIENT, provider: { useFactory: () => new JobManagerClient(logger, jobConfig.url) } },
    { token: SERVICES.JOB_SYNCER_MANAGER, provider: { useClass: JobSyncerManager } },
    { token: SERVICES.CATALOG_MANAGER, provider: { useClass: CatalogManager } },
  ];

  return registerDependencies(dependencies, options?.override, options?.useChild);
};
