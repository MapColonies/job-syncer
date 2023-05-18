import { IJobResponse } from '@map-colonies/mc-priority-queue';
import { IJobParameters, ITaskParameters } from '../../src/jobSyncerManager/interfaces';

export const jobManagerClientMock = {
  updateJob: jest.fn(),
  getJobs: jest.fn(),
};

export const getJobsMockResponse: IJobResponse<IJobParameters, ITaskParameters>[] = [
  {
    id: '1',
    completedTasks: 10,
    taskCount: 10,
  } as IJobResponse<IJobParameters, ITaskParameters>,
  {
    id: '2',
    completedTasks: 5,
    taskCount: 10,
  } as IJobResponse<IJobParameters, ITaskParameters>,
  {
    id: '3',
    completedTasks: 10,
    taskCount: 10,
  } as IJobResponse<IJobParameters, ITaskParameters>,
];
