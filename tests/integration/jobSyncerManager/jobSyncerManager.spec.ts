import { container } from 'tsyringe';
import config from 'config';
import jsLogger from '@map-colonies/js-logger';
import mockAxios from 'jest-mock-axios';
import { OperationStatus } from '@map-colonies/mc-priority-queue';
import { trace } from '@opentelemetry/api';
import { I3DCatalogUpsertRequestBody, Link } from '@map-colonies/mc-model-types';
import { getApp } from '../../../src/app';
import { INGESTION_JOB_TYPE, SERVICES } from '../../../src/common/constants';
import { JobSyncerManager } from '../../../src/jobSyncerManager/jobSyncer';
import { createJob, createIngestionJobParameters, createJobs, jobManagerClientMock } from '../../mocks/jobManagerMock';
import { createFakeMetadata } from '../../mocks/catalogManagerMock';
import { IIngestionJobParameters } from '../../../src/jobSyncerManager/interfaces';

describe('jobSyncerManager', () => {
  let jobSyncerManager: JobSyncerManager;

  beforeEach(() => {
    getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
        { token: SERVICES.JOB_MANAGER_CLIENT, provider: { useValue: jobManagerClientMock } },
      ],
    });

    jobSyncerManager = container.resolve(JobSyncerManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockAxios.reset();
  });

  describe('handleInProgressJobs', () => {
    it('When has completed job, it should insert the metadata to the catalog service', async () => {
      const jobs = createJobs();
      const finishedJob = createJob(INGESTION_JOB_TYPE, true);
      jobs.push(finishedJob);
      const finishedJobWithParameters = createJob(INGESTION_JOB_TYPE, true);
      finishedJobWithParameters.parameters = createIngestionJobParameters();
      jobManagerClientMock.getJobs.mockResolvedValue(jobs);
      jobManagerClientMock.getJob.mockResolvedValue(finishedJobWithParameters);
      jobManagerClientMock.updateJob.mockResolvedValue(undefined);
      const metadata = createFakeMetadata;
      mockAxios.post.mockResolvedValue({ data: metadata });
      const completedJobsCount = jobs.filter((job) => job.completedTasks === job.taskCount).length;

      await jobSyncerManager.handleInProgressJobs();

      expect(jobManagerClientMock.getJobs).toHaveBeenCalled();
      expect(jobManagerClientMock.updateJob).toHaveBeenCalledTimes(jobs.length);
      expect(mockAxios.post).toHaveBeenCalledTimes(completedJobsCount);

      const expectedLink = config.get<Link>('catalog.link');
      const parameters = finishedJobWithParameters.parameters as IIngestionJobParameters;
      const pathToTileset = parameters.pathToTileset.replace(/^[^/]+/, parameters.modelId);
      const expectedLinkName = `${parameters.modelId}-${parameters.metadata.productType}`;
      const expectedLinks: Link[] = [
        {
          ...expectedLink,
          name: expectedLinkName,
          url: `${expectedLink.url}/${pathToTileset}/${parameters.tilesetFilename}`,
        },
      ];
      const expectedCatalogMetadata: I3DCatalogUpsertRequestBody = {
        ...parameters.metadata,
        links: expectedLinks,
        id: parameters.modelId,
      };
      const catalogUrl = config.get<string>('catalog.url');
      expect(mockAxios.post).toHaveBeenCalledWith(`${catalogUrl}/metadata`, expectedCatalogMetadata);
    });

    it('When there is a problem with the catalog, it should update the job-manager', async () => {
      const jobs = createJobs();
      jobs.push(createJob(INGESTION_JOB_TYPE, true));
      const completedJobsPosition: number[] = [];
      for (let index = 0; index < jobs.length; index++) {
        if (jobs[index].completedTasks === jobs[index].taskCount) {
          completedJobsPosition.push(index);
        }
      }
      jobManagerClientMock.getJobs.mockResolvedValue(jobs);
      const jobWithParameters = jobs[0];
      jobWithParameters.parameters = createIngestionJobParameters();
      jobManagerClientMock.getJob.mockResolvedValue(jobWithParameters);
      jobManagerClientMock.updateJob.mockResolvedValue(undefined);
      mockAxios.post.mockRejectedValue(new Error('problem'));
      const payload = {
        percentage: 100,
        reason: 'problem',
        status: OperationStatus.FAILED,
      };

      await jobSyncerManager.handleInProgressJobs();

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

    it('When there is a problem with job-manager, it should throw an error', async () => {
      const job = [createJob(INGESTION_JOB_TYPE, false)];
      jobManagerClientMock.getJobs.mockResolvedValue(job);
      jobManagerClientMock.updateJob.mockRejectedValue(new Error('problem'));

      const response = jobSyncerManager.handleInProgressJobs();

      await expect(response).rejects.toThrow(Error);
      expect(mockAxios.post).not.toHaveBeenCalled();
      expect(mockAxios.delete).not.toHaveBeenCalled();
      expect(jobManagerClientMock.getJobs).toHaveBeenCalled();
      expect(jobManagerClientMock.updateJob).toHaveBeenCalled();
    });

    it('When there is a problem with job-manager, it should remove the new record from DB', async () => {
      const job = [createJob(INGESTION_JOB_TYPE, true)];
      jobManagerClientMock.getJobs.mockResolvedValue(job);
      jobManagerClientMock.updateJob.mockRejectedValue(new Error('problem'));
      mockAxios.post.mockResolvedValue({ data: createFakeMetadata });
      mockAxios.delete.mockResolvedValue({ data: createFakeMetadata });

      const response = jobSyncerManager.handleInProgressJobs();

      await expect(response).rejects.toThrow(Error);
      expect(mockAxios.delete).toHaveBeenCalled();
      expect(jobManagerClientMock.getJobs).toHaveBeenCalled();
      expect(jobManagerClientMock.updateJob).toHaveBeenCalled();
    });
  });
});
