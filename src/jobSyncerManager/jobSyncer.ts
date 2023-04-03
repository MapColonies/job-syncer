import { Logger } from '@map-colonies/js-logger';
import { I3DCatalogUpsertRequestBody, Pycsw3DCatalogRecord } from '@map-colonies/mc-model-types';
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
  private readonly nginxUrl: string;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONFIG) private readonly config: IConfig,
    @inject(SERVICES.JOB_MANAGER_CLIENT) private readonly jobManagerClient: JobManagerClient,
  ) {
    this.jobType = config.get<string>('jobManager.jobType');
    this.catalogUrl = config.get<string>('catalog.url');
    this.nginxUrl = this.config.get<string>('nginx.url');
  }

  public async progressJobs(): Promise<void> {
    const jobs = await this.getInProgressJobs(false);

    for (const job of jobs) {
      const payload: IUpdateJobBody<IJobParameters> = {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        percentage: parseInt(((job.completedTasks / job.taskCount) * 100).toString()),
      };

      let catalogMetadataId: string | null = null;

      if (job.taskCount === job.completedTasks) {
        payload.status = OperationStatus.COMPLETED;
        try {
          catalogMetadataId = await this.createCatalogMetadata(job.parameters);
        } catch (err) {
          payload.status = OperationStatus.FAILED;
          payload.reason = 'Problem with the catalog service';
        }
      }

      try {
        this.logger.info({ msg: 'Starting updateJob' });
        await this.jobManagerClient.updateJob<IJobParameters>(job.id, payload);
        this.logger.info({ msg: 'Done updateJob' });
      } catch (err) {
        this.logger.error({ msg: err });
        if (catalogMetadataId !== null) {
          await this.deleteCatalogMetadata(catalogMetadataId);
        }

        throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, `Problem with jobManager.`, true);
      }
    };
  }

  private async getInProgressJobs(shouldReturnTasks = false): Promise<IJobResponse<IJobParameters, ITaskParameters>[]> {
    this.logger.info({ msg: 'Starting getInProgressJobs' });
    const queryParams: IFindJobsRequest = {
      isCleaned: false,
      type: this.jobType,
      shouldReturnTasks,
      status: OperationStatus.IN_PROGRESS,
    };
    try {
      const jobs = await this.jobManagerClient.getJobs<IJobParameters, ITaskParameters>(queryParams);
      this.logger.info({ msg: 'Done getInProgressJobs' });
      return jobs;
    } catch (err) {
      this.logger.error({ msg: err });
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, `Problem with jobManager.`, true);
    }
  }

  private async createCatalogMetadata(jobParameters: IJobParameters): Promise<string> {
    this.logger.info({ msg: 'Starting createCatalogMetadata' });
    const metadata: I3DCatalogUpsertRequestBody = {
      ...jobParameters.metadata,
      links: [
        {
          protocol: '3D_LAYER',
          url: `${this.nginxUrl}/${jobParameters.modelId}/${jobParameters.tilesetFilename}`,
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
      const response: Response = await fetch(`${this.catalogUrl}/metadata`, requestOptions);
      const catalogMetadata = await response.json() as Pycsw3DCatalogRecord;

      // It should never be undefined
      this.logger.info({ msg: 'Done createCatalogMetadata' });
      return catalogMetadata.id as string;
    } catch (err) {
      this.logger.error({ msg: err });
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, `Problem with calling to the catalog while finalizing`, true);
    }
  }

  private async deleteCatalogMetadata(id: string): Promise<void> {
    const requestOptions = {
      method: 'DELETE',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { 'Content-Type': 'application/json' }
    }

    try {
      await fetch(`${this.catalogUrl}/metadata/${id}`, requestOptions);
    } catch (err) {
      this.logger.error({ msg: err });
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, `Problem in delete catalog metadata`, false);
    }
  }
}
