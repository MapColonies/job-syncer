import { container } from 'tsyringe';
import { IUpdateJobBody, OperationStatus } from '@map-colonies/mc-priority-queue';
import jsLogger from '@map-colonies/js-logger';
import { getApp } from '../../../src/app';
import { SERVICES } from '../../../src/common/constants';
import { JobSyncerManager } from '../../../src/jobSyncerManager/jobSyncer';
import { createJob, createJobs, jobManagerClientMock } from '../../mocks/jobManagerMock';
import { catalogManagerClientMock, catalogMetadataMock } from '../../mocks/catalogManagerMock';
import { IJobParameters } from '../../../src/jobSyncerManager/interfaces';

describe('jobSyncerManager', () => {
  let jobSyncerManager: JobSyncerManager;

  beforeAll(() => {
    getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.JOB_MANAGER_CLIENT, provider: { useValue: jobManagerClientMock } },
        { token: SERVICES.CATALOG_MANAGER, provider: { useValue: catalogManagerClientMock } },
      ],
    });

    jobSyncerManager = container.resolve(JobSyncerManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('progressJobs', () => {
    it('When does not have in-progress jobs, should do nothing', async () => {
      jobManagerClientMock.getJobs.mockResolvedValue([]);
      jobManagerClientMock.updateJob.mockResolvedValue(undefined);

      await jobSyncerManager.progressJobs();

      expect(jobManagerClientMock.updateJob).not.toHaveBeenCalled();
      expect(catalogManagerClientMock.createCatalogMetadata).not.toHaveBeenCalled();
      expect(jobManagerClientMock.getJobs).toHaveBeenCalled();
    });

    it('When has in-progress job, should progress them and update job-manager', async () => {
      const jobs = createJobs();
      jobManagerClientMock.getJobs.mockResolvedValue(jobs);
      jobManagerClientMock.updateJob.mockResolvedValue(undefined);
      catalogManagerClientMock.createCatalogMetadata.mockResolvedValue(catalogMetadataMock);

      await jobSyncerManager.progressJobs();

      expect(jobManagerClientMock.getJobs).toHaveBeenCalled();
      expect(jobManagerClientMock.updateJob).toHaveBeenCalledTimes(jobs.length);
    });

    it('When has completed job, it should insert the metadata to the catalog service', async () => {
      const jobs = createJobs();
      jobs.push(createJob(true));
      jobManagerClientMock.getJobs.mockResolvedValue(jobs);
      jobManagerClientMock.updateJob.mockResolvedValue(undefined);
      catalogManagerClientMock.createCatalogMetadata.mockResolvedValue(catalogMetadataMock);
      const completedJobsCount = jobs.filter((job) => job.completedTasks === job.taskCount).length;

      await jobSyncerManager.progressJobs();

      expect(jobManagerClientMock.getJobs).toHaveBeenCalled();
      expect(catalogManagerClientMock.createCatalogMetadata).toHaveBeenCalledTimes(completedJobsCount);
      expect(jobManagerClientMock.updateJob).toHaveBeenCalledTimes(jobs.length);
    });

    it('When has completed job but catalog failed to create metadata, the job will update with failed status', async () => {
      const jobs = createJobs();
      jobs.push(createJob(false, true));
      jobManagerClientMock.getJobs.mockResolvedValue(jobs);
      jobManagerClientMock.updateJob.mockResolvedValue(undefined);
      catalogManagerClientMock.createCatalogMetadata.mockRejectedValue(new Error('problem'));
      const payload: IUpdateJobBody<IJobParameters> = {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        percentage: parseInt(((jobs[jobs.length - 1].completedTasks / jobs[jobs.length - 1].taskCount) * 100).toString()),
        status: OperationStatus.FAILED,
      };

      await jobSyncerManager.progressJobs();

      expect(jobManagerClientMock.getJobs).toHaveBeenCalled();
      expect(jobManagerClientMock.updateJob).toHaveBeenLastCalledWith(jobs[jobs.length - 1].id, payload);
    });

    it('When updated catalog but failed to update job-manager, the catalog metadata will be removed', async () => {
      const jobs = createJobs();
      jobs.push(createJob(true));
      jobManagerClientMock.getJobs.mockResolvedValue(jobs);
      jobManagerClientMock.updateJob.mockRejectedValue(undefined);
      catalogManagerClientMock.createCatalogMetadata.mockResolvedValue(catalogMetadataMock);
      catalogManagerClientMock.deleteCatalogMetadata.mockResolvedValue(undefined);

      await jobSyncerManager.progressJobs();

      expect(jobManagerClientMock.getJobs).toHaveBeenCalled();
      expect(jobManagerClientMock.updateJob).toHaveBeenCalledTimes(jobs.length);
      expect(catalogManagerClientMock.deleteCatalogMetadata).toHaveBeenCalled();
    });
  });
});
