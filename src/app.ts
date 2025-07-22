import { setTimeout as setTimeoutPromise } from 'timers/promises';
import { inject, singleton } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { IConfig } from 'config';
import express, { Request, Response } from 'express';
import { Registry } from 'prom-client';
import { StatusCodes } from 'http-status-codes';
import { SERVICES } from './common/constants';
import { RegisterOptions, registerExternalValues } from './containerConfig';
import { JobSyncerManager } from './jobSyncerManager/jobSyncer';
import { LogContext } from './common/interfaces';

@singleton()
export class App {
  private readonly intervalMs: number;
  private readonly port: number;
  private readonly serverInstance: express.Application;
  private readonly logContext: LogContext;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONFIG) private readonly config: IConfig,
    @inject(SERVICES.JOB_SYNCER_MANAGER) private readonly jobSyncerManager: JobSyncerManager,
    @inject(SERVICES.METRICS_REGISTRY) private readonly metricsRegistry?: Registry
  ) {
    this.intervalMs = this.config.get<number>('jobSyncer.intervalMs');
    this.port = this.config.get<number>('server.port');
    this.serverInstance = express();

    if (this.metricsRegistry) {
      this.serverInstance.use(collectMetricsExpressMiddleware({ registry: this.metricsRegistry, collectNodeMetrics: true }));
    }
    this.serverInstance.get('/liveness', (req: Request, res: Response) => {
      res.status(StatusCodes.OK).send('OK');
    });
    this.logContext = {
      fileName: __filename,
      class: App.name,
    };
  }

  public async run(): Promise<void> {
    const logContext = { ...this.logContext, function: this.run.name };
    this.logger.info({
      msg: 'Starting jobSyncer',
      logContext,
    });

    this.serverInstance.listen(this.port, () => {
      this.logger.info({
        msg: `app started on port ${this.port}`,
        logContext,
      });
    });

    await this.mainLoop();
  }

  private async mainLoop(): Promise<void> {
    const isRunning = true;
    //eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (isRunning) {
      try {
        await this.jobSyncerManager.handleInProgressJobs();
        await setTimeoutPromise(this.intervalMs);
      } catch (err) {
        this.logger.error({
          msg: `mainLoop: Error: ${JSON.stringify(err, Object.getOwnPropertyNames(err))}`,
          err,
        });
        await setTimeoutPromise(this.intervalMs);
      }
    }
  }
}

export function getApp(registerOptions?: RegisterOptions): App {
  const container = registerExternalValues(registerOptions);
  const app = container.resolve(App);
  return app;
}
