import { Logger } from '@map-colonies/js-logger';
import { Pycsw3DCatalogRecord } from '@map-colonies/mc-model-types';
import { IFindJobsRequest, IJobResponse, IUpdateJobBody, JobManagerClient, OperationStatus } from '@map-colonies/mc-priority-queue';
import { IConfig } from 'config';
import { inject, injectable } from 'tsyringe';
import { CatalogManager } from '../catalogManager/catalogManager';
import { SERVICES } from '../common/constants';
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
      if (job.taskCount === 0) {
        this.logger.error({ msg: "This job has 0 tasks!! Not good" , job: job.id});
        continue;
      }
      let reason: string | null = null;
      let isCreateCatalogSuccess = true;
      const isJobCompleted = job.completedTasks === job.taskCount;

      try {
        if (isJobCompleted) {
          catalogMetadata = await this.catalogManagerClient.createCatalogMetadata(job.parameters);
        }
      } catch (error) {
        this.logger.error({ msg: error });
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

      this.logger.info({ msg: 'Finish job syncer !', jobId: job.id, payload});
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

  private buildPayload(job: IJobResponse<IJobParameters, ITaskParameters>, status:
    OperationStatus, reason: string | null): IUpdateJobBody<IJobParameters> {
      
    const payload: IUpdateJobBody<IJobParameters> = {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      percentage: parseInt(((job.completedTasks / job.taskCount) * 100).toString()),
      status,
    }

    if (reason !== null) {
      payload.reason = reason
    }

    return payload;
  }

  private getStatus(job: IJobResponse<IJobParameters, ITaskParameters>, isJobCompleted: boolean,
    isCreateCatalogSuccess: boolean): OperationStatus {
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