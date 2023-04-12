import { inject, injectable } from "tsyringe";
import { Logger } from "@map-colonies/js-logger";
import { I3DCatalogUpsertRequestBody, Pycsw3DCatalogRecord } from "@map-colonies/mc-model-types";
import { IConfig } from "../common/interfaces";
import { IJobParameters } from "../jobSyncerManager/interfaces";
import { SERVICES } from "../common/constants";

@injectable()
export class CatalogManager {
    private readonly catalogUrl: string;
    private readonly nginxUrl: string;

    public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger,
        @inject(SERVICES.CONFIG) private readonly config: IConfig) {
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

        const requestOptions = {
            method: 'POST',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metadata)
        }

        this.logger.info({ msg: 'Starting createCatalogMetadata' });
        const response: Response = await fetch(`${this.catalogUrl}/metadata`, requestOptions);
        const catalogMetadata = await response.json() as Pycsw3DCatalogRecord;

        this.logger.info({ msg: 'Finishing createCatalogMetadata', id: catalogMetadata.id });
        return catalogMetadata;
    }

    public async deleteCatalogMetadata(id: string): Promise<void> {
        const requestOptions = {
            method: 'DELETE',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers: { 'Content-Type': 'application/json' }
        }

        await fetch(`${this.catalogUrl}/metadata/${id}`, requestOptions);
    }
}