import { container } from 'tsyringe';
import jsLogger from '@map-colonies/js-logger';
import mockAxios from 'jest-mock-axios';
import { getApp } from '../../../src/app';
import { SERVICES } from '../../../src/common/constants';
import { JobSyncerManager } from '../../../src/jobSyncerManager/jobSyncer';
import { createJob, createJobs, jobManagerClientMock } from '../../mocks/jobManagerMock';
import { catalogManagerClientMock, catalogMetadataMock } from '../../mocks/catalogManagerMock';

describe('jobSyncerManager', () => {
  let jobSyncerManager: JobSyncerManager;

  beforeAll(() => {
    getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.JOB_MANAGER_CLIENT, provider: { useValue: jobManagerClientMock } },
      ],
    });

    jobSyncerManager = container.resolve(JobSyncerManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockAxios.reset();
  });

  describe('progressJobs', () => {
    it('When has completed job, it should insert the metadata to the catalog service', async () => {
      const jobs = createJobs();
      jobs.push(createJob(true));
      jobManagerClientMock.getJobs.mockResolvedValue(jobs);
      jobManagerClientMock.updateJob.mockResolvedValue(undefined);
      const metadata = catalogMetadataMock;
      mockAxios.post.mockResolvedValue({ data: metadata });
      const completedJobsCount = jobs.filter((job) => job.completedTasks === job.taskCount).length;

      await jobSyncerManager.progressJobs();

      expect(jobManagerClientMock.getJobs).toHaveBeenCalled();
      expect(catalogManagerClientMock.createCatalogMetadata).toHaveBeenCalledTimes(completedJobsCount);
      expect(jobManagerClientMock.updateJob).toHaveBeenCalledTimes(jobs.length);
    });
  });
});
