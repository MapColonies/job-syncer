import { Layer3DMetadata } from '@map-colonies/mc-model-types';

export interface IIngestionJobParameters {
  metadata: Layer3DMetadata;
  modelId: string;
  tilesetFilename: string;
  filesCount: number;
  pathToTileset: string;
}

export interface IIngestionTaskParameters {
  paths: string[];
  modelId: string;
}

export interface IDeleteJobParameters {
  modelId: string;
}

export interface JobManagerConfig {
  url: string;
  ingestion: {
    jobType: string;
  };
  delete: {
    jobType: string;
  };
}
