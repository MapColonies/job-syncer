import { Layer3DMetadata } from '@map-colonies/mc-model-types';

export interface IJobParameters {
  metadata: Layer3DMetadata;
  modelId: string;
  tilesetFilename: string;
  filesCount: number;
  pathToTileset: string
}

export interface ITaskParameters {
  paths: string[];
  modelId: string;
}

export interface JobManagerConfig {
  url: string;
  jobType: string;
}
