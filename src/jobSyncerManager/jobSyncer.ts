import { Logger } from '@map-colonies/js-logger';
import { Pycsw3DCatalogRecord } from '@map-colonies/mc-model-types';
import { IFindJobsRequest, IJobResponse, IUpdateJobBody, JobManagerClient, OperationStatus } from '@map-colonies/mc-priority-queue';
import { IConfig } from 'config';
import { inject, injectable } from 'tsyringe';
import { CatalogManager } from '../catalogManager/catalogManager';
import { JOB_TYPE, SERVICES } from '../common/constants';
import { IJobParameters, ITaskParameters } from '../jobSyncerManager/interfaces';

@injectable()
export class JobSyncerManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONFIG) private readonly config: IConfig,
    @inject(SERVICES.JOB_MANAGER_CLIENT) private readonly jobManagerClient: JobManagerClient,
    @inject(SERVICES.CATALOG_MANAGER) private readonly catalogManagerClient: CatalogManager
  ) {}

  public async progressJobs(): Promise<void> {
    this.logger.debug({ msg: 'Starting job syncer' });
    const jobs = await this.getInProgressJobs();

    let catalogMetadata: Pycsw3DCatalogRecord | null = null;

    for (const job of jobs) {
      let reason: string | null = null;
      let isCreateCatalogSuccess = true;
      const isJobCompleted = job.completedTasks === job.taskCount;

      try {
        if (isJobCompleted) {
          catalogMetadata = await this.catalogManagerClient.createCatalogMetadata(job.parameters);
          this.logger.info({ msg: `Job: ${job.id} is completed`, modelId: job.parameters.modelId, modelName: job.parameters.metadata.productName });
        }
      } catch (error) {
        this.logger.error({ msg: error, modelId: job.parameters.modelId, modelName: job.parameters.metadata.productName });
        isCreateCatalogSuccess = false;
        reason = (error as Error).message;
      }

      const status = this.getStatus(job, isJobCompleted, isCreateCatalogSuccess);
      const payload = this.buildPayload(job, status, reason);

      try {
        await this.handleUpdateJob(job.id, payload);
      } catch (error) {
        await this.handleUpdateJobRejection(error, catalogMetadata);
      }

      this.logger.debug({ msg: 'Finished job syncer', jobId: job.id, modelId: job.parameters.modelId, modelName: job.parameters.metadata.productName, payload });
    }
  }

  private async getInProgressJobs(): Promise<IJobResponse<IJobParameters, ITaskParameters>[]> {
    const queryParams: IFindJobsRequest = {
      status: OperationStatus.IN_PROGRESS,
      type: JOB_TYPE,
      // In newer version of job-manager, this is supposed to be default
      shouldReturnTasks: false,
    };

    this.logger.debug({ msg: 'Starting getInProgressJobs', queryParams });
    const jobs = await this.jobManagerClient.getJobs<IJobParameters, ITaskParameters>(queryParams);
    this.logger.debug({ msg: 'Finishing getInProgressJobs', count: jobs.length });
    return jobs;
  }

  private async handleUpdateJob(jobId: string, payload: IUpdateJobBody<IJobParameters>): Promise<void> {
    this.logger.debug({ msg: 'Starting updateJob', jobId });
    await this.jobManagerClient.updateJob<IJobParameters>(jobId, payload);
    this.logger.debug({ msg: 'Done updateJob', jobId });
  }

  private async handleUpdateJobRejection(error: unknown, catalogMetadata: Pycsw3DCatalogRecord | null): Promise<void> {
    if (catalogMetadata?.id !== undefined) {
      await this.catalogManagerClient.deleteCatalogMetadata(catalogMetadata.id);
    }

    if (error instanceof Error) {
      this.logger.error({ error, msg: 'Failed to updateJob', stack: error.stack });
      throw error;
    }
  }

  private buildPayload(
    job: IJobResponse<IJobParameters, ITaskParameters>,
    status: OperationStatus,
    reason: string | null
  ): IUpdateJobBody<IJobParameters> {
    const payload: IUpdateJobBody<IJobParameters> = {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      percentage: parseInt(((job.completedTasks / job.taskCount) * 100).toString()),
      status,
    };

    if (reason !== null) {
      payload.reason = reason;
    }

    return payload;
  }

  private getStatus(job: IJobResponse<IJobParameters, ITaskParameters>, isJobCompleted: boolean, isCreateCatalogSuccess: boolean): OperationStatus {
    const isJobNeedToFail = job.failedTasks > 0 && job.inProgressTasks === 0 && job.pendingTasks === 0;

    if (!isCreateCatalogSuccess || isJobNeedToFail) {
      return OperationStatus.FAILED;
    }

    if (isJobCompleted) {
      return OperationStatus.COMPLETED;
    }

    return OperationStatus.IN_PROGRESS;
  }
}
