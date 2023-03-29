import cron from 'node-cron';
import { container } from 'tsyringe';
import { getApp } from '../../../src/app';
import { JobSyncerManager } from '../../../src/jobSyncerManager/jobSyncer';

describe('jobSyncerManager', () => {
    let jobSyncerManager: JobSyncerManager;
    beforeAll(() => {
        getApp();

        jobSyncerManager = container.resolve(JobSyncerManager);
    });

    describe('scheduleCronJob', () => {
        const scheduleTime = '* * * * *';
        const jobSyncerManagerMock = {
            progressJobs: jest.fn(),
        };
        const cronMock = {
            validate: jest.fn(),
            schedule: jest.fn(),
        }
        // let appErrorConstructor: jest.Mock;
      
        // beforeEach(() => {
        //   appErrorConstructor = jest.fn();
        // });
      

        afterEach(() => {
          jest.restoreAllMocks();
        });
      
        it('should throw an error if the cron expression is not valid', () => {
          cronMock.mockReturnValue(false);


          const response = jobSyncerManager.scheduleCronJob();
      
          expect(() => {
            scheduleCronJob(scheduleTime, progressJobs, appErrorConstructor);
          }).toThrowErrorMatchingSnapshot();
        });
      
        it('should schedule a cron job to call progressJobs', () => {
          jest.spyOn(cron, 'validate').mockReturnValue(true);
          const scheduleSpy = jest.spyOn(cron, 'schedule').mockReturnValue({
            start: jest.fn(),
          });
      
          scheduleCronJob(scheduleTime, progressJobs, appErrorConstructor);
      
          expect(scheduleSpy).toHaveBeenCalledWith(scheduleTime, expect.any(Function));
        });
      });

});