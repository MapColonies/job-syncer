import { Logger } from '@map-colonies/js-logger';
import { inject, singleton } from 'tsyringe';
import { SERVICES } from './common/constants';
import { registerExternalValues, RegisterOptions } from './containerConfig';
import { JobSyncerManager } from './jobSyncerManager/jobSyncer';

@singleton()
export class App {
  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.JOB_SYNCER_MANAGER) private readonly jobSyncerManager: JobSyncerManager) { }

  public async run(): Promise<void> {
    this.logger.info({ msg: 'Start job syncer !' });
    await this.jobSyncerManager.progressJobs();
  }
}

export function getApp(registerOptions?: RegisterOptions): App {
  const container = registerExternalValues(registerOptions);
  const app = container.resolve(App);
  return app;
}
