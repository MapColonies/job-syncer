import { container } from 'tsyringe';
import { getApp } from '../../../src/app';
import { SERVICES } from '../../../src/common/constants';
import { JobSyncerManager } from '../../../src/jobSyncerManager/jobSyncer';
import { getJobsMockResponse, jobManagerClientMock } from '../../mocks/jobManagerMock';
import { catalogManagerClientMock, catalogMetadataMock } from '../../mocks/catalogManagerMock';

describe('jobSyncerManager', () => {
  let jobSyncerManager: JobSyncerManager;

  beforeAll(() => {
    getApp({
      override: [
        { token: SERVICES.JOB_MANAGER_CLIENT, provider: { useValue: jobManagerClientMock } },
        { token: SERVICES.CATALOG_MANAGER, provider: { useValue: catalogManagerClientMock } }
      ],
    });

    jobSyncerManager = container.resolve(JobSyncerManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('progressJobs', () => {
    it('When calling progressJobs without getting any jobs, then updateJob need not to be called and fetch', async () => {
      jobManagerClientMock.getJobs.mockResolvedValueOnce([]);
      jobManagerClientMock.updateJob.mockResolvedValue(undefined);

      await jobSyncerManager.progressJobs();

      expect(jobManagerClientMock.updateJob).not.toHaveBeenCalled();
      expect(catalogManagerClientMock.createCatalogMetadata).not.toHaveBeenCalled();
      expect(jobManagerClientMock.getJobs).toHaveBeenCalled();
    });

    it('When calling progressJobs it should update all the in progress jobs and update the catalog service', async () => {
      jobManagerClientMock.getJobs.mockResolvedValueOnce(getJobsMockResponse);
      jobManagerClientMock.updateJob.mockResolvedValue(undefined);
      catalogManagerClientMock.createCatalogMetadata.mockResolvedValue(catalogMetadataMock);
      const completedJobsCount = getJobsMockResponse.filter(job => job.completedTasks === job.taskCount).length

      await jobSyncerManager.progressJobs();

      expect(jobManagerClientMock.getJobs).toHaveBeenCalled();
      expect(catalogManagerClientMock.createCatalogMetadata).toHaveBeenCalledTimes(completedJobsCount);
      expect(jobManagerClientMock.updateJob).toHaveBeenCalledTimes(completedJobsCount);
    });

    it('When calling progressJobs and catalog failed to create catalogMetadata, the jobs will update with failed status', async () => {
      jobManagerClientMock.getJobs.mockResolvedValueOnce(getJobsMockResponse);
      jobManagerClientMock.updateJob.mockResolvedValue(undefined);
      catalogManagerClientMock.createCatalogMetadata.mockRejectedValue(null);

      await jobSyncerManager.progressJobs();

      expect(jobManagerClientMock.getJobs).toHaveBeenCalled();
      expect(jobManagerClientMock.updateJob).toHaveBeenCalledTimes(2);
    });

    it('When calling progressJobs and job update failed, the catalog metadata will be removed', async () => {
      jobManagerClientMock.getJobs.mockResolvedValueOnce(getJobsMockResponse);
      jobManagerClientMock.updateJob.mockRejectedValue(undefined);
      catalogManagerClientMock.createCatalogMetadata.mockResolvedValue(catalogMetadataMock);
      catalogManagerClientMock.deleteCatalogMetadata.mockResolvedValue(undefined);

      await jobSyncerManager.progressJobs();

      expect(jobManagerClientMock.getJobs).toHaveBeenCalled();
      expect(jobManagerClientMock.updateJob).toHaveBeenCalledTimes(2);
      expect(catalogManagerClientMock.deleteCatalogMetadata).toHaveBeenCalledTimes(2);
    });
  });
});
