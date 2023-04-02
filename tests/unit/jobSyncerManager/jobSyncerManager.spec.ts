import { container } from 'tsyringe';
import { getApp } from '../../../src/app';
import { SERVICES } from '../../../src/common/constants';
import { JobSyncerManager } from '../../../src/jobSyncerManager/jobSyncer';
import { jobManagerClientMock } from '../../mocks/jobManagerMock';

describe('jobSyncerManager', () => {
  let jobSyncerManager: JobSyncerManager;

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
    it('When calling progressJobs it should update all the in progress jobs and update the catalog service', async () => {
      jobManagerClientMock.getJobs.mockResolvedValueOnce([]);
      jobManagerClientMock.updateJob.mockResolvedValue(undefined);

      await jobSyncerManager.progressJobs();

      expect(jobManagerClientMock.getJobs).toHaveBeenCalledTimes(1);
      expect(jobManagerClientMock.updateJob).toHaveBeenCalledTimes(0);
    });
  });
});
