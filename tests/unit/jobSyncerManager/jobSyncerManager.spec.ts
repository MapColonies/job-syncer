import { container } from 'tsyringe';
import { getApp } from '../../../src/app';
import { SERVICES } from '../../../src/common/constants';
import { JobSyncerManager } from '../../../src/jobSyncerManager/jobSyncer';
import { getJobsMockResponse, jobManagerClientMock } from '../../mocks/jobManagerMock';

describe('jobSyncerManager', () => {
  let jobSyncerManager: JobSyncerManager;

  global.fetch = jest.fn(async () =>
    Promise.resolve({
      json: async () => Promise.resolve({ test: 100 }),
    }),
  ) as jest.Mock;

  beforeAll(() => {
    getApp({
      override: [{ token: SERVICES.JOB_MANAGER_CLIENT, provider: { useValue: jobManagerClientMock } }],
    });

    jobSyncerManager = container.resolve(JobSyncerManager);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('progressJobs', () => {
    it('When calling progressJobs without getting any jobs, then updateJob need not to be called and fetch', async () => {
      jobManagerClientMock.getJobs.mockResolvedValueOnce([]);
      jobManagerClientMock.updateJob.mockResolvedValue(undefined);

      await jobSyncerManager.progressJobs();

      expect(jobManagerClientMock.updateJob).not.toHaveBeenCalled();
      expect(jobManagerClientMock.getJobs).toHaveBeenCalled();
    });

    it('When calling progressJobs it should update all the in progress jobs and update the catalog service', async () => {
      jobManagerClientMock.getJobs.mockResolvedValueOnce(getJobsMockResponse);
      jobManagerClientMock.updateJob.mockResolvedValue(undefined);

      await jobSyncerManager.progressJobs();

      expect(jobManagerClientMock.getJobs).toHaveBeenCalled();
      expect(jobManagerClientMock.updateJob).toHaveBeenCalledTimes(3);
    });
  });
});
