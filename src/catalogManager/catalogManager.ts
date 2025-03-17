import { inject, injectable } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { I3DCatalogUpsertRequestBody, Link, Pycsw3DCatalogRecord } from '@map-colonies/mc-model-types';
import axios from 'axios';
import { Tracer } from '@opentelemetry/api';
import { withSpanAsyncV4 } from '@map-colonies/telemetry';
import { IConfig, LogContext } from '../common/interfaces';
import { IJobParameters } from '../jobSyncerManager/interfaces';
import { SERVICES } from '../common/constants';

@injectable()
export class CatalogManager {
  private readonly catalogUrl: string;
  private readonly link: Link;
  private readonly logContext: LogContext;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.TRACER) public readonly tracer: Tracer,
    @inject(SERVICES.CONFIG) private readonly config: IConfig
  ) {
    this.catalogUrl = this.config.get<string>('catalog.url');
    this.link = this.config.get<Link>('catalog.link');
    this.logContext = {
      fileName: __filename,
      class: CatalogManager.name,
    };
  }

  @withSpanAsyncV4
  public async createCatalogMetadata(jobParameters: IJobParameters): Promise<Pycsw3DCatalogRecord> {
    const logContext = { ...this.logContext, function: this.createCatalogMetadata.name };

    const pathToTileset = jobParameters.pathToTileset.replace(/^[^/]+/, jobParameters.modelId);
    const linkName = `${jobParameters.modelId}-${jobParameters.metadata.productType}`;
    const links: Link[] = [{ ...this.link, name: linkName, url: `${this.link.url}/${pathToTileset}/${jobParameters.tilesetFilename}` }];
    const metadata: I3DCatalogUpsertRequestBody = {
      ...jobParameters.metadata,
      links,
      id: jobParameters.modelId,
    };

    this.logger.debug({
      msg: 'Starting createCatalogMetadata',
      logContext,
      modelId: jobParameters.modelId,
      modelName: jobParameters.metadata.productName,
    });
    const catalogMetadata = await axios.post<Pycsw3DCatalogRecord>(`${this.catalogUrl}/metadata`, metadata);
    this.logger.debug({
      msg: 'Finishing createCatalogMetadata',
      logContext,
      id: catalogMetadata.data.id,
      modelId: jobParameters.modelId,
      modelName: jobParameters.metadata.productName,
    });

    return catalogMetadata.data;
  }

  @withSpanAsyncV4
  public async deleteCatalogMetadata(id: string): Promise<void> {
    await axios.delete(`${this.catalogUrl}/metadata/${id}`);
  }
}
