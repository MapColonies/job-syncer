import { inject, injectable } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { I3DCatalogUpsertRequestBody, Link, Pycsw3DCatalogRecord } from '@map-colonies/mc-model-types';
import axios from 'axios';
import { Tracer } from '@opentelemetry/api';
import { withSpanAsync } from '@map-colonies/telemetry';
import { StatusCodes } from 'http-status-codes';
import { IConfig, IFindRecordsPayload, LogContext } from '../common/interfaces';
import { IIngestionJobParameters } from '../jobSyncerManager/interfaces';
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

  @withSpanAsync
  public async createCatalogMetadata(jobParameters: IIngestionJobParameters): Promise<Pycsw3DCatalogRecord> {
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

  @withSpanAsync
  public async deleteCatalogMetadata(id: string): Promise<void> {
    this.logger.debug({ msg: 'Starting delete catalog record', modelId: id });
    await axios.delete(`${this.catalogUrl}/metadata/${id}`);
    this.logger.debug({ msg: 'Finishing deleteMetadata', id: id });
  }

  @withSpanAsync
  public async findRecords(payload: IFindRecordsPayload): Promise<Pycsw3DCatalogRecord[]> {
    const logContext = { ...this.logContext, function: this.findRecords.name };
    this.logger.debug({
      msg: 'Find Records in catalog service',
      logContext,
    });
    try {
      const response = await axios.post<Pycsw3DCatalogRecord[]>(`${this.catalogUrl}/metadata/find`, payload);
      if (response.status === StatusCodes.OK.valueOf() && Array.isArray(response.data)) {
        this.logger.debug({
          msg: `Find ${response.data.length} Records in catalog service`,
          logContext,
        });
        return response.data;
      } else {
        this.logger.error({
          msg: `Something went wrong in catalog when tring to find records, service returned ${response.status}`,
          logContext,
          response,
        });
        throw new Error('Problem with the catalog during Finding Records');
      }
    } catch (err) {
      this.logger.error({
        msg: 'Something went wrong in catalog when tring to find records',
        logContext,
        err,
      });
      throw new Error('Problem with the catalog during Finding Records');
    }
  }
}
