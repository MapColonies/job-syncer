import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { IConfig } from 'config';
import httpStatus from 'http-status-codes';
import cron from 'node-cron';
import { IFindJobsRequest, IJobResponse, IUpdateJobBody, JobManagerClient, OperationStatus } from '@map-colonies/mc-priority-queue';
import axios from 'axios';
import { I3DCatalogUpsertRequestBody } from '@map-colonies/mc-model-types';
import { SERVICES } from '../common/constants';
import { AppError } from '../common/appError';
import { IJobParameters, ITaskParameters } from '../common/interfaces';

@injectable()
export class JobSyncerManager {
  private readonly runTime: string;
  private readonly jobType: string;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONFIG) private readonly config: IConfig,
    @inject(SERVICES.JOB_MANAGER_CLIENT) private readonly jobManagerClient: JobManagerClient,
    ) {
    this.jobType = config.get<string>('worker.job.type');
    this.runTime = config.get<string>('jobSyncer.runTime');
  }

  public jobSyncer(): void {

    if (!cron.validate(this.runTime)) {
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `the cron expression is not valid! value: ${this.runTime}`, false);
    }

    cron.schedule(this.runTime, async () => this.progressJobs);
    
  };
  
  private async progressJobs(): Promise<void> {
    console.log('Running cron job');
    const jobs = await this.getInProgressJobs(false);
      jobs?.map(async (job) => {
        const payload: IUpdateJobBody<IJobParameters> = {
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          percentage: parseInt(((job.completedTasks / job.taskCount) * 100).toString()),
        };
        if (job.taskCount == job.completedTasks) {
          payload.status = OperationStatus.COMPLETED;
          try {
            await this.finalizeJob(job.parameters);
          } catch (err) {
            payload.status = OperationStatus.FAILED;
            payload.reason = 'Problem with the catalog service';
          }
        }

        try {
          await this.jobManagerClient.updateJob<IJobParameters>(job.id, payload);
        } catch (err) {
          this.logger.error({ msg: err });
          throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Problem with jobManager. Didn't get job to work on`, true);
        }
      });
  }

  private async getInProgressJobs(shouldReturnTasks = false): Promise<IJobResponse<IJobParameters, ITaskParameters>[] | undefined> {
    const queryParams: IFindJobsRequest = {
      isCleaned: false,
      type: this.jobType,
      shouldReturnTasks: shouldReturnTasks,
      status: OperationStatus.IN_PROGRESS,
    };
    try {
      const jobs = await this.jobManagerClient.getJobs<IJobParameters, ITaskParameters>(queryParams);
      return jobs;
    } catch (err) {
      this.logger.error({ msg: err });
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Problem with jobManager. Didn't get job to work on`, true);
    }
  }

  private async finalizeJob(jobParameters: IJobParameters): Promise<void> {
    const nginxUrl = this.config.get<string>('nginx.url');
    const metadata: I3DCatalogUpsertRequestBody = {
      ...jobParameters.metadata,
      links: [
        {
          protocol: '3D_LAYER',
          url: `${nginxUrl}/${jobParameters.modelId}/${jobParameters.tilesetFilename}`,
        },
      ],
    };
    const catalogUrl = this.config.get<string>('catalog.url');
    try {
      await axios.post<string>(catalogUrl, metadata);
    } catch (err) {
      this.logger.error({ msg: err });
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Problem with calling to the catalog while finalizing`, true);
    }
  }
}
