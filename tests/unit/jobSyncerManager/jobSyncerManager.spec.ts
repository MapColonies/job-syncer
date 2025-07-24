import { container } from 'tsyringe';
import { IUpdateJobBody, OperationStatus } from '@map-colonies/mc-priority-queue';
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { faker } from '@faker-js/faker';
import { getApp } from '../../../src/app';
import { DELETE_JOB_TYPE, INGESTION_JOB_TYPE, SERVICES } from '../../../src/common/constants';
import { JobSyncerManager } from '../../../src/jobSyncerManager/jobSyncer';
import { createJob, createIngestionJobParameters, jobManagerClientMock } from '../../mocks/jobManagerMock';
import { catalogManagerClientMock, createFakeMetadata } from '../../mocks/catalogManagerMock';
import { IIngestionJobParameters } from '../../../src/jobSyncerManager/interfaces';

describe('jobSyncerManager', () => {
  let jobSyncerManager: JobSyncerManager;

  beforeEach(() => {
    getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
        { token: SERVICES.JOB_MANAGER_CLIENT, provider: { useValue: jobManagerClientMock } },
        { token: SERVICES.CATALOG_MANAGER, provider: { useValue: catalogManagerClientMock } },
      ],
    });

    jobSyncerManager = container.resolve(JobSyncerManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('handleInProgressJobs', () => {
    it('When does not have in-progress jobs, should do nothing', async () => {
      jobManagerClientMock.findJobs.mockResolvedValueOnce([]);

      const result = await jobSyncerManager.handleInProgressJobs();

      expect(jobManagerClientMock.findJobs).toHaveBeenCalled();
      expect(jobManagerClientMock.updateJob).not.toHaveBeenCalled();
      expect(catalogManagerClientMock.createCatalogMetadata).not.toHaveBeenCalled();
      expect(result).toBeFalsy();
    });

    it('When has Ingestion in-progress job, should progress them and update job-manager', async () => {
      const job = createJob(INGESTION_JOB_TYPE, true);
      jobManagerClientMock.findJobs.mockResolvedValueOnce([job]);
      job.parameters = createIngestionJobParameters();
      jobManagerClientMock.getJob.mockResolvedValueOnce(job);
      jobManagerClientMock.updateJob.mockResolvedValueOnce(undefined);
      catalogManagerClientMock.createCatalogMetadata.mockResolvedValueOnce(createFakeMetadata);

      await jobSyncerManager.handleInProgressJobs();

      expect(jobManagerClientMock.findJobs).toHaveBeenCalled();
      expect(jobManagerClientMock.updateJob).toHaveBeenCalled();
    });

    it('When has Delete in-progress job, should progress them and update job-manager', async () => {
      const job = createJob(DELETE_JOB_TYPE, true);
      job.parameters = {
        modelId: faker.word.sample(),
      };
      jobManagerClientMock.findJobs.mockResolvedValueOnce([job]);
      jobManagerClientMock.updateJob.mockResolvedValueOnce(undefined);
      catalogManagerClientMock.findRecords.mockResolvedValueOnce([{}]);

      await jobSyncerManager.handleInProgressJobs();

      expect(jobManagerClientMock.findJobs).toHaveBeenCalled();
      expect(catalogManagerClientMock.findRecords).toHaveBeenCalled();
      expect(catalogManagerClientMock.deleteCatalogMetadata).toHaveBeenCalled();
      expect(jobManagerClientMock.updateJob).toHaveBeenCalledTimes(1);
    });

    it('When has Delete in-progress job, and record isnt found in catalog - finish success, dont call delete', async () => {
      const job = createJob(DELETE_JOB_TYPE, true);
      job.parameters = {
        modelId: faker.word.sample(),
      };
      jobManagerClientMock.findJobs.mockResolvedValueOnce([job]);
      jobManagerClientMock.updateJob.mockResolvedValueOnce(undefined);
      catalogManagerClientMock.findRecords.mockResolvedValueOnce([]);

      await jobSyncerManager.handleInProgressJobs();

      expect(jobManagerClientMock.findJobs).toHaveBeenCalled();
      expect(catalogManagerClientMock.findRecords).toHaveBeenCalled();
      expect(catalogManagerClientMock.deleteCatalogMetadata).not.toHaveBeenCalled();
      expect(jobManagerClientMock.updateJob).toHaveBeenCalledTimes(1);
    });

    it('When has Delete in-progress job, and record found more than 1 time in catalog - finish success', async () => {
      const job = createJob(DELETE_JOB_TYPE, true);
      job.parameters = {
        modelId: faker.word.sample(),
      };
      jobManagerClientMock.findJobs.mockResolvedValueOnce([job]);
      jobManagerClientMock.updateJob.mockResolvedValueOnce(undefined);
      catalogManagerClientMock.findRecords.mockResolvedValueOnce([{}, {}]);

      await jobSyncerManager.handleInProgressJobs();

      expect(jobManagerClientMock.findJobs).toHaveBeenCalled();
      expect(catalogManagerClientMock.findRecords).toHaveBeenCalled();
      expect(catalogManagerClientMock.deleteCatalogMetadata).toHaveBeenCalled();
      expect(jobManagerClientMock.updateJob).toHaveBeenCalledTimes(1);
    });

    it('When has Ingestion completed job, it should insert the metadata to the catalog service', async () => {
      const job = createJob(INGESTION_JOB_TYPE, true);
      jobManagerClientMock.findJobs.mockResolvedValueOnce([job]);
      jobManagerClientMock.getJob.mockResolvedValueOnce(job);
      jobManagerClientMock.updateJob.mockResolvedValueOnce(undefined);
      catalogManagerClientMock.createCatalogMetadata.mockResolvedValueOnce(createFakeMetadata);

      await jobSyncerManager.handleInProgressJobs();

      expect(jobManagerClientMock.findJobs).toHaveBeenCalled();
      expect(jobManagerClientMock.getJob).toHaveBeenCalled();
      expect(jobManagerClientMock.updateJob).toHaveBeenCalled();
      expect(catalogManagerClientMock.createCatalogMetadata).toHaveBeenCalled();
    });

    it('When has Ingestion completed job but catalog failed to create metadata, the job will update with failed status', async () => {
      const job = createJob(INGESTION_JOB_TYPE, true);
      jobManagerClientMock.findJobs.mockResolvedValueOnce([job]);
      jobManagerClientMock.getJob.mockResolvedValueOnce(job);
      jobManagerClientMock.updateJob.mockResolvedValueOnce(undefined);
      catalogManagerClientMock.createCatalogMetadata.mockRejectedValueOnce(new Error('problem'));
      const payload: IUpdateJobBody<IIngestionJobParameters> = {
        percentage: 100,
        status: OperationStatus.FAILED,
        reason: 'problem',
      };

      await jobSyncerManager.handleInProgressJobs();

      expect(jobManagerClientMock.findJobs).toHaveBeenCalled();
      expect(jobManagerClientMock.getJob).toHaveBeenCalled();
      expect(jobManagerClientMock.updateJob).toHaveBeenLastCalledWith(job.id, payload);
    });

    it('When Ingestion updated catalog but failed to update job-manager, the catalog metadata will be removed', async () => {
      const job = createJob(INGESTION_JOB_TYPE, true);
      jobManagerClientMock.findJobs.mockResolvedValueOnce([job]);
      jobManagerClientMock.getJob.mockResolvedValueOnce(job);
      jobManagerClientMock.updateJob.mockRejectedValueOnce(new Error('problem'));
      catalogManagerClientMock.createCatalogMetadata.mockResolvedValueOnce(createFakeMetadata);
      catalogManagerClientMock.deleteCatalogMetadata.mockResolvedValueOnce(undefined);

      await expect(jobSyncerManager.handleInProgressJobs()).rejects.toThrow('problem');
      expect(jobManagerClientMock.findJobs).toHaveBeenCalled();
      expect(jobManagerClientMock.getJob).toHaveBeenCalled();
      expect(catalogManagerClientMock.createCatalogMetadata).toHaveBeenCalled();
      expect(catalogManagerClientMock.deleteCatalogMetadata).toHaveBeenCalled();
    });

    it('When has Ingestion & Delete in-progress jobs, should finish the both', async () => {
      const ingestionJob = createJob(INGESTION_JOB_TYPE, true);
      ingestionJob.parameters = createIngestionJobParameters();

      const jobDelete = createJob(DELETE_JOB_TYPE, true);
      jobDelete.parameters = {
        modelId: faker.word.sample(),
      };

      jobManagerClientMock.findJobs.mockResolvedValueOnce([ingestionJob, jobDelete]);
      jobManagerClientMock.getJob.mockResolvedValueOnce(ingestionJob);
      catalogManagerClientMock.createCatalogMetadata.mockResolvedValueOnce(createFakeMetadata);
      catalogManagerClientMock.findRecords.mockResolvedValueOnce([{}]);

      const result = await jobSyncerManager.handleInProgressJobs();

      expect(jobManagerClientMock.findJobs).toHaveBeenCalled();
      expect(jobManagerClientMock.updateJob).toHaveBeenCalledTimes(2);
      expect(catalogManagerClientMock.findRecords).toHaveBeenCalled();
      expect(catalogManagerClientMock.deleteCatalogMetadata).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it('When has Ingestion & Delete in-progress jobs, and "Delete" update job failes - should finish the ingestion after', async () => {
      const ingestionJob = createJob(INGESTION_JOB_TYPE, true);
      ingestionJob.parameters = createIngestionJobParameters();

      const jobDelete = createJob(DELETE_JOB_TYPE, true);
      jobDelete.parameters = {
        modelId: faker.word.sample(),
      };

      jobManagerClientMock.findJobs.mockResolvedValueOnce([jobDelete, ingestionJob]);
      jobManagerClientMock.getJob.mockResolvedValueOnce(ingestionJob);
      catalogManagerClientMock.createCatalogMetadata.mockResolvedValueOnce(createFakeMetadata);
      catalogManagerClientMock.findRecords.mockResolvedValueOnce([{}]);
      jobManagerClientMock.updateJob.mockRejectedValueOnce(new Error('problem'));

      const result = await jobSyncerManager.handleInProgressJobs();

      expect(jobManagerClientMock.findJobs).toHaveBeenCalled();
      expect(jobManagerClientMock.updateJob).toHaveBeenCalledTimes(2);
      expect(catalogManagerClientMock.findRecords).toHaveBeenCalled();
      expect(catalogManagerClientMock.deleteCatalogMetadata).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });
  });
});
