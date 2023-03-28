import { Logger } from '@map-colonies/js-logger';
import { inject, singleton } from 'tsyringe';
import { SERVICES } from './common/constants';
import { registerExternalValues, RegisterOptions } from './containerConfig';
import { JobSyncerManager } from './jobSyncerManager/jobSyncer';

@singleton()
export class App {
  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger, 
  @inject(SERVICES.JOB_SYNCER_MANAGER)  private readonly jobSyncerManager: JobSyncerManager) {}

  public run(): void {
    this.logger.info({ msg: 'Starting worker' });
    this.jobSyncerManager.scheduleCronJob();
  }
}

export function getApp(registerOptions?: RegisterOptions): App {
  const container = registerExternalValues(registerOptions);
  const app = container.resolve(App);
  return app;
}
