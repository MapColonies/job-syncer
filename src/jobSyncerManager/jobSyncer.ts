import { Logger } from '@map-colonies/js-logger';
import { Pycsw3DCatalogRecord } from '@map-colonies/mc-model-types';
import { IFindJobsByCriteriaBody, IJobResponse, IUpdateJobBody, JobManagerClient, OperationStatus } from '@map-colonies/mc-priority-queue';
import { IConfig } from 'config';
import { inject, injectable } from 'tsyringe';
import { Tracer, trace } from '@opentelemetry/api';
import { INFRA_CONVENTIONS, THREE_D_CONVENTIONS } from '@map-colonies/telemetry/conventions';
import { withSpanAsyncV4 } from '@map-colonies/telemetry';
import { CatalogManager } from '../catalogManager/catalogManager';
import { DELETE_JOB_TYPE, INGESTION_JOB_TYPE, SERVICES } from '../common/constants';
import { IDeleteJobParameters, IIngestionJobParameters, IIngestionTaskParameters } from '../jobSyncerManager/interfaces';
import { LogContext } from '../common/interfaces';

@injectable()
export class JobSyncerManager {
  private readonly logContext: LogContext;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.TRACER) public readonly tracer: Tracer,
    @inject(SERVICES.CONFIG) private readonly config: IConfig,
    @inject(SERVICES.JOB_MANAGER_CLIENT) private readonly jobManagerClient: JobManagerClient,
    @inject(SERVICES.CATALOG_MANAGER) private readonly catalogManagerClient: CatalogManager
  ) {
    this.logContext = {
      fileName: __filename,
      class: JobSyncerManager.name,
    };
  }

  @withSpanAsyncV4
  private async progressJobs(jobs: IJobResponse<unknown, unknown>[]): Promise<void> {
    const logContext = { ...this.logContext, function: this.progressJobs.name };

    for (const job of jobs) {
      const spanActive = trace.getActiveSpan();
      spanActive?.setAttributes({
        [INFRA_CONVENTIONS.infra.jobManagement.jobId]: job.id,
        [INFRA_CONVENTIONS.infra.jobManagement.jobType]: job.type,
        [THREE_D_CONVENTIONS.three_d.catalogManager.catalogId]: job.resourceId,
      });

      if (job.type == INGESTION_JOB_TYPE) {
        await this.handleIngestionJob(job as unknown as IJobResponse<IIngestionJobParameters, IIngestionTaskParameters>);
      } else if (job.type == DELETE_JOB_TYPE) {
        await this.handleDeleteJob(job as unknown as IJobResponse<IDeleteJobParameters, unknown>);
      } else {
        this.logger.error({
          msg: `Job: ${job.id} has unsupported Type ${job.type}`,
          logContext,
          [INFRA_CONVENTIONS.infra.jobManagement.jobId]: job.id,
        });
      }
    }
  }

  @withSpanAsyncV4
  private async handleDeleteJob(job: IJobResponse<IDeleteJobParameters, unknown>): Promise<void> {
    const logContext = { ...this.logContext, function: this.handleDeleteJob.name };
    const isJobCompleted = job.completedTasks === job.taskCount;
    if (isJobCompleted) {
      // delete from catalog
      try {
        const records = await this.catalogManagerClient.findRecords({ id: job.parameters.modelId });
        if (Array.isArray(records)) {
          if (records.length == 0) {
            this.logger.warn({
              msg: `didn't found a record with id ${job.parameters.modelId} after delete task was finished`,
              logContext,
              [INFRA_CONVENTIONS.infra.jobManagement.jobId]: job.id,
              [INFRA_CONVENTIONS.infra.jobManagement.jobType]: DELETE_JOB_TYPE,
              [THREE_D_CONVENTIONS.three_d.catalogManager.catalogId]: job.resourceId,
            });
          } else {
            if (records.length > 1) {
              this.logger.warn({
                msg: `found more than one record with id ${job.parameters.modelId} after delete task was finished`,
                logContext,
                [INFRA_CONVENTIONS.infra.jobManagement.jobId]: job.id,
                [INFRA_CONVENTIONS.infra.jobManagement.jobType]: DELETE_JOB_TYPE,
                [THREE_D_CONVENTIONS.three_d.catalogManager.catalogId]: job.resourceId,
              });
            }
            await this.catalogManagerClient.deleteCatalogMetadata(job.parameters.modelId);
          }
        }
        // close the job
        const jobPayload = this.buildJobPayload(job, OperationStatus.COMPLETED, null);
        await this.jobManagerClient.updateJob(job.id, jobPayload);
      } catch (err) {
        this.logger.error({
          msg: `failed to finish delete job with id ${job.parameters.modelId}`,
          err,
          logContext,
          [INFRA_CONVENTIONS.infra.jobManagement.jobId]: job.id,
          [INFRA_CONVENTIONS.infra.jobManagement.jobType]: job.type,
          [THREE_D_CONVENTIONS.three_d.catalogManager.catalogId]: job.resourceId,
        });
      }
    }
  }

  @withSpanAsyncV4
  private async handleIngestionJob(job: IJobResponse<IIngestionJobParameters, IIngestionTaskParameters>): Promise<void> {
    const logContext = { ...this.logContext, function: this.handleIngestionJob.name };
    let catalogMetadata: Pycsw3DCatalogRecord | null = null;
    let reason: string | null = null;
    let isCreateCatalogSuccess = true;
    const isJobCompleted = job.completedTasks === job.taskCount;
    try {
      if (isJobCompleted) {
        const jobDataWithParameters = await this.jobManagerClient.getJob<IIngestionJobParameters, IIngestionTaskParameters>(job.id, false);
        const jobParameters = jobDataWithParameters.parameters;
        catalogMetadata = await this.catalogManagerClient.createCatalogMetadata(jobParameters);
        this.logger.info({
          msg: `Job: ${job.id} is completed`,
          logContext,
          modelId: jobParameters.modelId,
          modelName: jobParameters.metadata.productName,
          [INFRA_CONVENTIONS.infra.jobManagement.jobId]: job.id,
          [INFRA_CONVENTIONS.infra.jobManagement.jobType]: job.type,
          [THREE_D_CONVENTIONS.three_d.catalogManager.catalogId]: job.resourceId,
        });
      }
    } catch (err) {
      this.logger.error({
        err,
        logContext,
        [INFRA_CONVENTIONS.infra.jobManagement.jobId]: job.id,
        [INFRA_CONVENTIONS.infra.jobManagement.jobType]: job.type,
        [THREE_D_CONVENTIONS.three_d.catalogManager.catalogId]: job.resourceId,
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
      [INFRA_CONVENTIONS.infra.jobManagement.jobId]: job.id,
      [INFRA_CONVENTIONS.infra.jobManagement.jobType]: INGESTION_JOB_TYPE,
      [THREE_D_CONVENTIONS.three_d.catalogManager.catalogId]: job.resourceId,
      payload: jobPayload,
    });
  }

  @withSpanAsyncV4
  private async getInProgressJobs(): Promise<IJobResponse<unknown, unknown>[]> {
    const logContext = { ...this.logContext, function: this.getInProgressJobs.name };

    const findJobsBody: IFindJobsByCriteriaBody = {
      statuses: [OperationStatus.IN_PROGRESS],
      types: [INGESTION_JOB_TYPE, DELETE_JOB_TYPE],
      shouldReturnTasks: false,
      shouldReturnAvailableActions: false,
    };

    this.logger.debug({
      msg: 'Starting getInProgressJobs',
      logContext,
      queryParams: findJobsBody,
    });

    const jobs = await this.jobManagerClient.findJobs(findJobsBody);

    this.logger.debug({
      msg: 'Finishing getInProgressJobs',
      logContext,
      count: jobs.length,
    });
    return jobs;
  }

  @withSpanAsyncV4
  private async handleUpdateJob(jobId: string, payload: IUpdateJobBody<IIngestionJobParameters>): Promise<void> {
    const logContext = { ...this.logContext, function: this.handleUpdateJob.name };
    this.logger.debug({
      msg: 'Starting updateJob',
      logContext,
      jobId,
    });
    await this.jobManagerClient.updateJob<IIngestionJobParameters>(jobId, payload);
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

  public async handleInProgressJobs(): Promise<boolean> {
    const logContext = { ...this.logContext, function: this.handleInProgressJobs.name };

    this.logger.debug({
      msg: `Getting In-Progress jobs`,
      logContext,
    });
    const jobs = await this.getInProgressJobs();
    if (Array.isArray(jobs) && jobs.length > 0) {
      await this.progressJobs(jobs);
      return true;
    }
    return false;
  }

  private buildJobPayload(
    job: IJobResponse<IIngestionJobParameters | IDeleteJobParameters, unknown>,
    status: OperationStatus,
    reason: string | null
  ): IUpdateJobBody<IIngestionJobParameters> {
    const payload: IUpdateJobBody<IIngestionJobParameters> = {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      percentage: parseInt(((job.completedTasks / job.taskCount) * 100).toString()),
      status,
    };

    if (reason !== null) {
      payload.reason = reason;
    }

    return payload;
  }

  private getStatus(
    job: IJobResponse<IIngestionJobParameters, IIngestionTaskParameters>,
    isJobCompleted: boolean,
    isCreateCatalogSuccess: boolean
  ): OperationStatus {
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
