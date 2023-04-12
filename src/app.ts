import { inject, singleton } from 'tsyringe';
import { SERVICES } from './common/constants';
import { RegisterOptions, registerExternalValues } from './containerConfig';
import { JobSyncerManager } from './jobSyncerManager/jobSyncer';

@singleton()
export class App {
  public constructor(@inject(SERVICES.JOB_SYNCER_MANAGER) private readonly jobSyncerManager: JobSyncerManager) { }

  public async run(): Promise<void> {
    await this.jobSyncerManager.progressJobs();
  }
}

export function getApp(registerOptions?: RegisterOptions): App {
  const container = registerExternalValues(registerOptions);
  const app = container.resolve(App);
  return app;
}
