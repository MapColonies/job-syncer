import { Pycsw3DCatalogRecord } from "@map-colonies/mc-model-types";

export const catalogManagerClientMock = {
  createCatalogMetadata: jest.fn(),
  deleteCatalogMetadata: jest.fn(),
};

export const catalogMetadataMock: Pycsw3DCatalogRecord = { id: "1", } as Pycsw3DCatalogRecord;