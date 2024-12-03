import { Logger } from '@map-colonies/js-logger';
import { Pycsw3DCatalogRecord } from '@map-colonies/mc-model-types';
import { IFindJobsRequest, IJobResponse, IUpdateJobBody, JobManagerClient, OperationStatus } from '@map-colonies/mc-priority-queue';
import { IConfig } from 'config';
import { inject, injectable } from 'tsyringe';
import { Tracer, trace } from '@opentelemetry/api';
import { INFRA_CONVENTIONS, THREE_D_CONVENTIONS } from '@map-colonies/telemetry/conventions';
import { withSpanAsyncV4 } from '@map-colonies/telemetry';
import { CatalogManager } from '../catalogManager/catalogManager';
import { JOB_TYPE, SERVICES } from '../common/constants';
import { IJobParameters, ITaskParameters } from '../jobSyncerManager/interfaces';
import { LogContext } from '../common/interfaces';

@injectable()
export class JobSyncerManager {
  private isActive: boolean;
  private readonly logContext: LogContext;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.TRACER) public readonly tracer: Tracer,
    @inject(SERVICES.CONFIG) private readonly config: IConfig,
    @inject(SERVICES.JOB_MANAGER_CLIENT) private readonly jobManagerClient: JobManagerClient,
    @inject(SERVICES.CATALOG_MANAGER) private readonly catalogManagerClient: CatalogManager
  ) {
    this.isActive = false;
    this.logContext = {
      fileName: __filename,
      class: JobSyncerManager.name,
    };
  }

  @withSpanAsyncV4
  private async progressJobs(jobs: IJobResponse<IJobParameters, ITaskParameters>[]): Promise<void> {
    const logContext = { ...this.logContext, function: this.progressJobs.name };
    let catalogMetadata: Pycsw3DCatalogRecord | null = null;

    for (const job of jobs) {
      const spanActive = trace.getActiveSpan();
      spanActive?.setAttributes({
        [INFRA_CONVENTIONS.infra.jobManagement.jobId]: job.id,
        [INFRA_CONVENTIONS.infra.jobManagement.jobType]: JOB_TYPE,
        [THREE_D_CONVENTIONS.three_d.catalogManager.catalogId]: job.resourceId,
      });

      let reason: string | null = null;
      let isCreateCatalogSuccess = true;
      const isJobCompleted = job.completedTasks === job.taskCount;

      try {
        if (isJobCompleted) {
          catalogMetadata = await this.catalogManagerClient.createCatalogMetadata(job.parameters);
          this.logger.info({
            msg: `Job: ${job.id} is completed`,
            logContext,
            modelId: job.parameters.modelId,
            modelName: job.parameters.metadata.productName,
          });
        }
      } catch (err) {
        this.logger.error({
          err,
          logContext,
          modelId: job.parameters.modelId,
          modelName: job.parameters.metadata.productName,
        });
        isCreateCatalogSuccess = false;
        reason = (err as Error).message;
      }

      const status = this.getStatus(job, isJobCompleted, isCreateCatalogSuccess);
      const jobPayload = this.buildJobPayload(job, status, reason);

      try {
        await this.handleUpdateJob(job.id, jobPayload);
      } catch (error) {
        await this.handleUpdateJobRejection(error, catalogMetadata);
      }

      this.logger.debug({
        msg: 'Finished job syncer',
        logContext,
        jobId: job.id,
        modelId: job.parameters.modelId,
        modelName: job.parameters.metadata.productName,
        payload: jobPayload,
      });
    }
  }

  @withSpanAsyncV4
  private async getInProgressJobs(): Promise<IJobResponse<IJobParameters, ITaskParameters>[]> {
    const logContext = { ...this.logContext, function: this.getInProgressJobs.name };
    const queryParams: IFindJobsRequest = {
      status: OperationStatus.IN_PROGRESS,
      type: JOB_TYPE,
      // In newer version of job-manager, this is supposed to be default
      shouldReturnTasks: false,
    };

    this.logger.debug({
      msg: 'Starting getInProgressJobs',
      logContext,
      queryParams,
    });
    const jobs = await this.jobManagerClient.getJobs<IJobParameters, ITaskParameters>(queryParams);
    this.logger.debug({
      msg: 'Finishing getInProgressJobs',
      logContext,
      count: jobs.length,
    });
    return jobs;
  }

  @withSpanAsyncV4
  private async handleUpdateJob(jobId: string, payload: IUpdateJobBody<IJobParameters>): Promise<void> {
    const logContext = { ...this.logContext, function: this.handleUpdateJob.name };
    this.logger.debug({
      msg: 'Starting updateJob',
      logContext,
      jobId,
    });
    await this.jobManagerClient.updateJob<IJobParameters>(jobId, payload);
    this.logger.debug({
      msg: 'Done updateJob',
      logContext,
      jobId,
    });
  }

  @withSpanAsyncV4
  private async handleUpdateJobRejection(err: unknown, catalogMetadata: Pycsw3DCatalogRecord | null): Promise<void> {
    const logContext = { ...this.logContext, function: this.handleUpdateJobRejection.name };
    if (catalogMetadata?.id !== undefined) {
      await this.catalogManagerClient.deleteCatalogMetadata(catalogMetadata.id);
    }

    if (err instanceof Error) {
      this.logger.error({
        err,
        logContext,
        msg: 'Failed to updateJob',
        stack: err.stack,
      });
      throw err;
    }
  }

  public async execute(): Promise<void> {
    if (this.isActive) {
      return;
    }
    const logContext = { ...this.logContext, function: this.execute.name };
    this.isActive = true;

    this.logger.debug({
      msg: `Getting In-Progress jobs`,
      logContext,
    });
    const jobs = await this.getInProgressJobs();
    if (jobs.length > 0) {
      await this.progressJobs(jobs);
    }

    this.isActive = false;
  }

  private buildJobPayload(
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
