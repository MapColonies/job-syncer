import { container } from 'tsyringe';
import { IUpdateJobBody, OperationStatus } from '@map-colonies/mc-priority-queue';
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { getApp } from '../../../src/app';
import { SERVICES } from '../../../src/common/constants';
import { JobSyncerManager } from '../../../src/jobSyncerManager/jobSyncer';
import { createJob, createJobs, jobManagerClientMock } from '../../mocks/jobManagerMock';
import { catalogManagerClientMock, createFakeMetadata } from '../../mocks/catalogManagerMock';
import { IJobParameters } from '../../../src/jobSyncerManager/interfaces';

describe('jobSyncerManager', () => {
  let jobSyncerManager: JobSyncerManager;

  beforeEach(async () => {
    await getApp({
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
  });

  describe('execute', () => {
    it('When need to start a new job but has already an active one, it should not start the job', async () => {
      jobSyncerManager['isActive'] = true;

      await jobSyncerManager.execute();

      expect(jobManagerClientMock.updateJob).not.toHaveBeenCalled();
      expect(catalogManagerClientMock.createCatalogMetadata).not.toHaveBeenCalled();
      expect(jobManagerClientMock.getJobs).not.toHaveBeenCalled();
    });

    it('When does not have in-progress jobs, should do nothing', async () => {
      jobManagerClientMock.getJobs.mockResolvedValue([]);
      jobManagerClientMock.updateJob.mockResolvedValue(undefined);

      await jobSyncerManager.execute();

      expect(jobManagerClientMock.updateJob).not.toHaveBeenCalled();
      expect(catalogManagerClientMock.createCatalogMetadata).not.toHaveBeenCalled();
      expect(jobManagerClientMock.getJobs).toHaveBeenCalled();
    });

    it('When has in-progress job, should progress them and update job-manager', async () => {
      const jobs = createJobs();
      jobManagerClientMock.getJobs.mockResolvedValue(jobs);
      jobManagerClientMock.updateJob.mockResolvedValue(undefined);
      catalogManagerClientMock.createCatalogMetadata.mockResolvedValue(createFakeMetadata);

      await jobSyncerManager.execute();

      expect(jobManagerClientMock.getJobs).toHaveBeenCalled();
      expect(jobManagerClientMock.updateJob).toHaveBeenCalledTimes(jobs.length);
    });

    it('When has completed job, it should insert the metadata to the catalog service', async () => {
      const job = createJob(true);
      jobManagerClientMock.getJobs.mockResolvedValue([job]);
      jobManagerClientMock.updateJob.mockResolvedValue(undefined);
      catalogManagerClientMock.createCatalogMetadata.mockResolvedValue(createFakeMetadata);

      await jobSyncerManager.execute();

      expect(jobManagerClientMock.getJobs).toHaveBeenCalled();
      expect(jobManagerClientMock.updateJob).toHaveBeenCalled();
      expect(catalogManagerClientMock.createCatalogMetadata).toHaveBeenCalled();
    });

    it('When has completed job but catalog failed to create metadata, the job will update with failed status', async () => {
      const job = createJob(true);
      jobManagerClientMock.getJobs.mockResolvedValue([job]);
      jobManagerClientMock.updateJob.mockResolvedValue(undefined);
      catalogManagerClientMock.createCatalogMetadata.mockRejectedValue(new Error('problem'));
      const payload: IUpdateJobBody<IJobParameters> = {
        percentage: 100,
        status: OperationStatus.FAILED,
        reason: 'problem',
      };

      await jobSyncerManager.execute();

      expect(jobManagerClientMock.getJobs).toHaveBeenCalled();
      expect(jobManagerClientMock.updateJob).toHaveBeenLastCalledWith(job.id, payload);
    });

    it('When updated catalog but failed to update job-manager, the catalog metadata will be removed', async () => {
      const job = createJob(true);
      jobManagerClientMock.getJobs.mockResolvedValue([job]);
      jobManagerClientMock.updateJob.mockRejectedValue(new Error('problem'));
      catalogManagerClientMock.createCatalogMetadata.mockResolvedValue(createFakeMetadata);
      catalogManagerClientMock.deleteCatalogMetadata.mockResolvedValue(undefined);

      await expect(jobSyncerManager.execute()).rejects.toThrow('problem');
      expect(jobManagerClientMock.getJobs).toHaveBeenCalled();
      expect(catalogManagerClientMock.createCatalogMetadata).toHaveBeenCalled();
      expect(catalogManagerClientMock.deleteCatalogMetadata).toHaveBeenCalled();
    });
  });
});
