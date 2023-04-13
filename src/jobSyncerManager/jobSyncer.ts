import { Logger } from '@map-colonies/js-logger';
import { Pycsw3DCatalogRecord } from '@map-colonies/mc-model-types';
import { IFindJobsRequest, IJobResponse, IUpdateJobBody, JobManagerClient, OperationStatus } from '@map-colonies/mc-priority-queue';
import { IConfig } from 'config';
import { inject, injectable } from 'tsyringe';
import { CatalogManager } from '../catalogManager/catalogManager';
import { ERROR_WITH_CATALOG_SERVICE, SERVICES } from '../common/constants';
import { IJobParameters, ITaskParameters } from '../jobSyncerManager/interfaces';

@injectable()
export class JobSyncerManager {
  private readonly jobType: string;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONFIG) private readonly config: IConfig,
    @inject(SERVICES.JOB_MANAGER_CLIENT) private readonly jobManagerClient: JobManagerClient,
    @inject(SERVICES.CATALOG_MANAGER) private readonly catalogManagerClient: CatalogManager,
  ) {
    this.jobType = this.config.get<string>('jobManager.jobType');
  }

  public async progressJobs(): Promise<void> {
    this.logger.info({ msg: 'Start job syncer !' });
    const jobs = await this.getInProgressJobs(false);

    let catalogMetadata: Pycsw3DCatalogRecord | null = null;

    for (const job of jobs) {
      const isJobCompleted = job.completedTasks === job.taskCount;
      let payload: IUpdateJobBody<IJobParameters> = {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        percentage: parseInt(((job.completedTasks / job.taskCount) * 100).toString()),
        status: OperationStatus.COMPLETED
      };

      try {
        if (isJobCompleted) {
          catalogMetadata = await this.catalogManagerClient.createCatalogMetadata(job.parameters);
        }
      } catch (err) {
        payload = {
          ...payload, reason: ERROR_WITH_CATALOG_SERVICE, status: OperationStatus.COMPLETED
        }
      }

      try {
        await this.handleUpdateJob(job.id, payload);
      } catch (error) {
        await this.handleUpdateJobRejection(error, catalogMetadata);
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

  private async handleUpdateJob(jobId: string, payload: IUpdateJobBody<IJobParameters>): Promise<void> {
    this.logger.info({ msg: 'Starting updateJob' });
    await this.jobManagerClient.updateJob<IJobParameters>(jobId, payload);
    this.logger.info({ msg: 'Done updateJob' });
  }

  private async handleUpdateJobRejection(error: unknown, catalogMetadata: Pycsw3DCatalogRecord | null): Promise<void> {
    if (catalogMetadata?.id !== undefined) {
      await this.catalogManagerClient.deleteCatalogMetadata(catalogMetadata.id);
    }

    if (error instanceof Error) {
      this.logger.error({ error, msg: "Failed to updateJob", stack: error.stack });
      throw error;
    }
  }
}