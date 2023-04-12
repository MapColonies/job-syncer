import { Logger } from '@map-colonies/js-logger';
import { I3DCatalogUpsertRequestBody, Pycsw3DCatalogRecord } from '@map-colonies/mc-model-types';
import { IFindJobsRequest, IJobResponse, IUpdateJobBody, JobManagerClient, OperationStatus } from '@map-colonies/mc-priority-queue';
import { IConfig } from 'config';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '../common/constants';
import { IJobParameters, ITaskParameters } from '../jobSyncerManager/interfaces';

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
    this.jobType = this.config.get<string>('jobManager.jobType');
    this.catalogUrl = this.config.get<string>('catalog.url');
    this.nginxUrl = this.config.get<string>('nginx.url');
  }

  public async progressJobs(): Promise<void> {
    this.logger.info({ msg: 'Start job syncer !' });
    const jobs = await this.getInProgressJobs(false);

    for (const job of jobs) {
      const payload: IUpdateJobBody<IJobParameters> = {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        percentage: parseInt(((job.completedTasks / job.taskCount) * 100).toString()),
      };

      let catalogMetadataId: Pycsw3DCatalogRecord | null = null;
      const isJobCompleted = job.taskCount === job.completedTasks;

      if (isJobCompleted) {
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
      } catch (error) {
        if (catalogMetadataId?.id !== undefined) {
          await this.deleteCatalogMetadata(catalogMetadataId.id);
        }
        this.handleError(error, 'Failed to updateJob');
      }

      this.logger.info({ msg: 'Finish job syncer !' });
    };
  }

  private async getInProgressJobs(shouldReturnTasks = false): Promise<IJobResponse<IJobParameters, ITaskParameters>[]> {
    const queryParams: IFindJobsRequest = {
      isCleaned: false,
      type: this.jobType,
      shouldReturnTasks,
      status: OperationStatus.IN_PROGRESS,
    };

    this.logger.info({ msg: 'Starting getInProgressJobs', queryParams });
    const jobs = await this.jobManagerClient.getJobs<IJobParameters, ITaskParameters>(queryParams);
    this.logger.info({ msg: 'Finishing getInProgressJobs', count: jobs.length });
    return jobs;
  }

  private async createCatalogMetadata(jobParameters: IJobParameters): Promise<Pycsw3DCatalogRecord> {
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

    this.logger.info({ msg: 'Starting createCatalogMetadata' });
    const response: Response = await fetch(`${this.catalogUrl}/metadata`, requestOptions);
    const catalogMetadata = await response.json() as Pycsw3DCatalogRecord;

    this.logger.info({ msg: 'Finishing createCatalogMetadata', id: catalogMetadata.id });
    return catalogMetadata;
  }

  private async deleteCatalogMetadata(id: string): Promise<void> {
    const requestOptions = {
      method: 'DELETE',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { 'Content-Type': 'application/json' }
    }

    await fetch(`${this.catalogUrl}/metadata/${id}`, requestOptions);
  }


  private handleError(error: unknown, msg: string): void {
    if (error instanceof Error) {
      this.logger.error({ error, msg, stack: error.stack });
      throw error;
    }
  }
}