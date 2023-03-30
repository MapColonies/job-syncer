import cron from 'node-cron';
import { container } from 'tsyringe';
import { getApp } from '../../../src/app';
import { AppError } from '../../../src/common/appError';
import { JobSyncerManager } from '../../../src/jobSyncerManager/jobSyncer';

describe('jobSyncerManager', () => {
    let jobSyncerManager: JobSyncerManager;
    beforeAll(() => {
        getApp();
        jobSyncerManager = container.resolve(JobSyncerManager);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('scheduleCronJob', () => {
        const jobSyncerManagerMock = {
            progressJobs: jest.fn(),
        };
        const cronMock = {
            validate: jest.fn(),
            schedule: jest.fn(),
        };
        
        it('Should schedule a cron job to call progressJobs', () => {
          cronMock.validate.mockReturnValue(true);
          cronMock.schedule.mockImplementationOnce(() => jobSyncerManagerMock.progressJobs.mockReturnThis());
      
          jobSyncerManager.scheduleCronJob();
          
          expect(jobSyncerManagerMock.progressJobs).toHaveBeenCalled();
        });

        it('should throw an error when the cron expression is not valid', () => {
          cronMock.validate.mockReturnValue(false);

          const response = jobSyncerManager.scheduleCronJob();
      
          expect(response).toThrow(AppError);
        });
      });

});