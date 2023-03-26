import { Layer3DMetadata } from '@map-colonies/mc-model-types';

export interface IConfig {
  get: <T>(setting: string) => T;
  has: (setting: string) => boolean;
}

export interface IJobParameters {
  metadata: Layer3DMetadata;
  modelId: string;
  tilesetFilename: string;
}

export interface ITaskParameters {
  paths: string[];
  modelId: string;
}

export interface JobManagerConfig {
  url: string;
  jobType: string;
}