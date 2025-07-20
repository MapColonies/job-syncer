import { Layer3DMetadata, ProductType } from '@map-colonies/mc-model-types';
import { IJobResponse, OperationStatus } from '@map-colonies/mc-priority-queue';
import { faker } from '@faker-js/faker';
import { IIngestionJobParameters, IIngestionTaskParameters } from '../../src/jobSyncerManager/interfaces';

const maxTaskCount = 10;
const maxJobsNumber = 5;

export const jobManagerClientMock = {
  updateJob: jest.fn(),
  getJobs: jest.fn(),
  getJob: jest.fn(),
};

export const createJobParameters = (): IIngestionJobParameters => {
  return {
    metadata: {
      productId: 'productIdTest',
      productType: ProductType.PHOTO_REALISTIC_3D,
    } as Layer3DMetadata,
    modelId: faker.string.uuid(),
    tilesetFilename: faker.string.uuid(),
    filesCount: faker.number.int(),
    pathToTileset: `${faker.word.sample()}/${faker.word.sample()}`,
  };
};

export const createJob = (allTasksCompleted = false, hasFailedTasks = false): IJobResponse<IIngestionJobParameters, IIngestionTaskParameters> => {
  const completedTasks = faker.number.int({ min: 1, max: maxTaskCount - 1 });
  const taskCount = allTasksCompleted ? completedTasks : faker.number.int({ min: completedTasks + 1, max: maxTaskCount });
  const failedTasks = hasFailedTasks ? taskCount - completedTasks : 0;
  const inProgressTasks = taskCount - completedTasks - failedTasks;
  const pendingTasks = taskCount - completedTasks - failedTasks - inProgressTasks;
  return {
    id: faker.string.uuid(),
    completedTasks,
    taskCount,
    failedTasks,
    inProgressTasks,
    pendingTasks,
    status: OperationStatus.IN_PROGRESS,
    resourceId: faker.string.uuid(),
    version: faker.word.sample(),
    type: faker.word.sample(),
    description: faker.word.words(),
    reason: faker.word.words(),
    created: faker.word.sample(),
    updated: faker.word.sample(),
    percentage: faker.number.int(),
    isCleaned: false,
    priority: faker.number.int(),
    expiredTasks: 0,
    abortedTasks: 0,
    domain: faker.word.sample(),
  } as unknown as IJobResponse<IIngestionJobParameters, IIngestionTaskParameters>;
};

export const createJobs = (
  jobsAmount = faker.number.int({ min: 1, max: maxJobsNumber })
): IJobResponse<IIngestionJobParameters, IIngestionTaskParameters>[] => {
  const jobs: IJobResponse<IIngestionJobParameters, IIngestionTaskParameters>[] = [];
  for (let index = 1; index < jobsAmount; index++) {
    jobs.push(createJob(faker.datatype.boolean()));
  }
  return jobs;
};
