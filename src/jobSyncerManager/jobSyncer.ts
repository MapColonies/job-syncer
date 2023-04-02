import { Logger } from '@map-colonies/js-logger';
import { I3DCatalogUpsertRequestBody } from '@map-colonies/mc-model-types';
import { IFindJobsRequest, IJobResponse, IUpdateJobBody, JobManagerClient, OperationStatus } from '@map-colonies/mc-priority-queue';
import { IConfig } from 'config';
import httpStatus from 'http-status-codes';
import { inject, injectable } from 'tsyringe';
import { AppError } from '../common/appError';
import { SERVICES } from '../common/constants';
import { IJobParameters, ITaskParameters } from '../common/interfaces';

@injectable()
export class JobSyncerManager {
  private readonly jobType: string;
  private readonly catalogUrl: string;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONFIG) private readonly config: IConfig,
    @inject(SERVICES.JOB_MANAGER_CLIENT) private readonly jobManagerClient: JobManagerClient,
  ) {
    this.jobType = config.get<string>('jobManager.jobType');
    this.catalogUrl = config.get<string>('catalog.url');
  }

  public async progressJobs(): Promise<void> {
    const jobs = await this.getInProgressJobs(false);

    for (const job of jobs) {
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
        throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Problem with jobManager.`, true);
      }
    };
  }

  private async getInProgressJobs(shouldReturnTasks = false): Promise<IJobResponse<IJobParameters, ITaskParameters>[]> {
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
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Problem with jobManager.`, true);
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

    const requestOptions = {
      method: 'POST',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata)
    }

    try {
      await fetch(`${this.catalogUrl}/metadata`, requestOptions);
    } catch (err) {
      this.logger.error({ msg: err });
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Problem with calling to the catalog while finalizing`, true);
    }
  }
}
