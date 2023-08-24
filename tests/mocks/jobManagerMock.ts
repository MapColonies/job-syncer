import { Layer3DMetadata } from '@map-colonies/mc-model-types';
import { IJobResponse, OperationStatus } from '@map-colonies/mc-priority-queue';
import { randBoolean, randNumber, randSentence, randUuid, randWord } from '@ngneat/falso';
import { IJobParameters, ITaskParameters } from '../../src/jobSyncerManager/interfaces';

const maxTaskCount = 10;
const maxJobsNumber = 5;

export const jobManagerClientMock = {
  updateJob: jest.fn(),
  getJobs: jest.fn(),
};

export const createJobParameters = (): IJobParameters => {
  return {
    metadata: {} as Layer3DMetadata,
    modelId: randUuid(),
    tilesetFilename: randUuid(),
    filesCount: randNumber(),
    pathToTileset: `${randWord()}/${randWord()}`
  };
};

export const createJob = (allTasksCompleted = false, hasFailedTasks = false): IJobResponse<IJobParameters, ITaskParameters> => {
  const completedTasks = randNumber({ min: 1, max: maxTaskCount - 1 });
  const taskCount = allTasksCompleted ? completedTasks : randNumber({ min: completedTasks + 1, max: maxTaskCount });
  const failedTasks = hasFailedTasks ? taskCount - completedTasks : 0;
  const inProgressTasks = taskCount - completedTasks - failedTasks;
  const pendingTasks = taskCount - completedTasks - failedTasks - inProgressTasks;
  return {
    id: randUuid(),
    completedTasks,
    taskCount,
    failedTasks,
    inProgressTasks,
    pendingTasks,
    status: OperationStatus.IN_PROGRESS,
    resourceId: randUuid(),
    version: randWord(),
    type: randWord(),
    description: randSentence(),
    parameters: createJobParameters(),
    reason: randSentence(),
    created: randWord(),
    updated: randWord(),
    percentage: randNumber(),
    isCleaned: false,
    priority: randNumber(),
    expiredTasks: 0,
    abortedTasks: 0,
    domain: randWord(),
  };
};

export const createJobs = (jobsAmount = randNumber({ min: 1, max: maxJobsNumber })): IJobResponse<IJobParameters, ITaskParameters>[] => {
  const jobs: IJobResponse<IJobParameters, ITaskParameters>[] = [];
  for (let index = 1; index < jobsAmount; index++) {
    jobs.push(createJob(randBoolean()));
  }
  return jobs;
};
