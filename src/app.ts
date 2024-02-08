import { inject, singleton } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { IConfig } from 'config';
import { SERVICES } from './common/constants';
import { RegisterOptions, registerExternalValues } from './containerConfig';
import { JobSyncerManager } from './jobSyncerManager/jobSyncer';

@singleton()
export class App {
  private readonly intervalMs: number;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONFIG) private readonly config: IConfig,
    @inject(SERVICES.JOB_SYNCER_MANAGER) private readonly jobSyncerManager: JobSyncerManager
  ) {
    this.intervalMs = this.config.get<number>('jobSyncer.intervalMs');
  }

  public run(): void {
    this.logger.info({ msg: 'Starting jobSyncer' });
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setInterval(async () => this.jobSyncerManager.progressJobs(), this.intervalMs);
  }
}

export function getApp(registerOptions?: RegisterOptions): App {
  const container = registerExternalValues(registerOptions);
  const app = container.resolve(App);
  return app;
}
