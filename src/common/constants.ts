import config from 'config';
import { readPackageJsonSync } from '@map-colonies/read-pkg';

const packageJsonData = readPackageJsonSync();
export const SERVICE_NAME = packageJsonData.name ?? 'unknown_service';
export const SERVICE_VERSION = packageJsonData.version ?? 'unknown_version';

export const NODE_VERSION = process.versions.node;

export const JOB_TYPE = config.get<string>('jobManager.job.type');

/* eslint-disable @typescript-eslint/naming-convention */
export const SERVICES: Record<string, symbol> = {
  LOGGER: Symbol('Logger'),
  CONFIG: Symbol('Config'),
  TRACER: Symbol('Tracer'),
  JOB_MANAGER_CLIENT: Symbol('JobManagerClient'),
  JOB_SYNCER_MANAGER: Symbol('JobSyncerManager'),
  CATALOG_MANAGER: Symbol('CatalogManager'),
};
/* eslint-enable @typescript-eslint/naming-convention */
