import { container } from 'tsyringe';
import jsLogger from '@map-colonies/js-logger';
import mockAxios from 'jest-mock-axios';
import { OperationStatus } from '@map-colonies/mc-priority-queue';
import { getApp } from '../../../src/app';
import { SERVICES } from '../../../src/common/constants';
import { JobSyncerManager } from '../../../src/jobSyncerManager/jobSyncer';
import { createJob, createJobs, jobManagerClientMock } from '../../mocks/jobManagerMock';
import { createFakeMetadata } from '../../mocks/catalogManagerMock';

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
      const metadata = createFakeMetadata;
      mockAxios.post.mockResolvedValue({ data: metadata });
      const completedJobsCount = jobs.filter((job) => job.completedTasks === job.taskCount).length;

      await jobSyncerManager.progressJobs();

      expect(jobManagerClientMock.getJobs).toHaveBeenCalled();
      expect(jobManagerClientMock.updateJob).toHaveBeenCalledTimes(jobs.length);
      expect(mockAxios.post).toHaveBeenCalledTimes(completedJobsCount);
    });

    it('When there is a problem with the catalog, it should update the job-manager', async () => {
      const jobs = createJobs();
      jobs.push(createJob(true));
      const completedJobsPosition: number[] = [];
      for (let index = 0; index < jobs.length; index++) {
        if (jobs[index].completedTasks === jobs[index].taskCount) {
          completedJobsPosition.push(index);
        }
      }
      jobManagerClientMock.getJobs.mockResolvedValue(jobs);
      jobManagerClientMock.updateJob.mockResolvedValue(undefined);
      mockAxios.post.mockRejectedValue(new Error('problem'));
      const payload = {
        percentage: 100,
        reason: 'problem',
        status: OperationStatus.FAILED,
      };

      await jobSyncerManager.progressJobs();

      expect(jobManagerClientMock.getJobs).toHaveBeenCalled();
      expect(jobManagerClientMock.updateJob).toHaveBeenCalledTimes(jobs.length);
      for (let index = 0; index < completedJobsPosition.length; index++) {
        expect(jobManagerClientMock.updateJob).toHaveBeenNthCalledWith(
          completedJobsPosition[index] + 1,
          jobs[completedJobsPosition[index]].id,
          payload
        );
      }
    });
  });
});
