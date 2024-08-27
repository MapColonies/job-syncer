import config from 'config';
import jsLogger from '@map-colonies/js-logger';
import { logMethod } from '@map-colonies/telemetry';
import { trace } from '@opentelemetry/api';
import { instanceCachingFactory } from 'tsyringe';
import client from 'prom-client';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import { JobManagerClient } from '@map-colonies/mc-priority-queue';
import { SERVICES, SERVICE_NAME } from './common/constants';
import { tracing } from './common/tracing';
import { InjectionObject, registerDependencies } from './common/dependencyRegistration';
import { JobSyncerManager } from './jobSyncerManager/jobSyncer';
import { CatalogManager } from './catalogManager/catalogManager';
import { getConfig } from './common/config';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = (options?: RegisterOptions): DependencyContainer => {
  const configInstance = getConfig();

  const loggerConfig = configInstance.get('telemetry.logger');
  const logger = jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, hooks: { logMethod } });
  const jobConfig = configInstance.get('jobManager');

  tracing.start();
  const tracer = trace.getTracer(SERVICE_NAME);

  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: configInstance } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },
    { token: SERVICES.TRACER, provider: { useValue: tracer } },
    {
      token: SERVICES.METRICS_REGISTRY,
      provider: {
        useFactory: instanceCachingFactory(() => {
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
