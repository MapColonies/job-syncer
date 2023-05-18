import { inject, injectable } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { I3DCatalogUpsertRequestBody, Pycsw3DCatalogRecord } from '@map-colonies/mc-model-types';
import axios from 'axios';
import { IConfig } from '../common/interfaces';
import { IJobParameters } from '../jobSyncerManager/interfaces';
import { SERVICES } from '../common/constants';

@injectable()
export class CatalogManager {
  private readonly catalogUrl: string;
  private readonly nginxUrl: string;

  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger, @inject(SERVICES.CONFIG) private readonly config: IConfig) {
    this.catalogUrl = this.config.get<string>('catalog.url');
    this.nginxUrl = this.config.get<string>('nginx.url');
  }

  public async createCatalogMetadata(jobParameters: IJobParameters): Promise<Pycsw3DCatalogRecord> {
    const metadata: I3DCatalogUpsertRequestBody = {
      ...jobParameters.metadata,
      links: [
        {
          protocol: '3D_LAYER',
          url: `${this.nginxUrl}/${jobParameters.modelId}/${jobParameters.tilesetFilename}`,
        },
      ],
    };

    this.logger.info({ msg: 'Starting createCatalogMetadata' });
    const catalogMetadata = await axios.post<Pycsw3DCatalogRecord>(`${this.catalogUrl}/metadata`, metadata);

    this.logger.info({ msg: 'Finishing createCatalogMetadata', id: catalogMetadata.data.id });
    return catalogMetadata.data;
  }

  public async deleteCatalogMetadata(id: string): Promise<void> {
    await axios.delete(`${this.catalogUrl}/metadata/${id}`);
  }
}
