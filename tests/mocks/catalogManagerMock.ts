import { Pycsw3DCatalogRecord } from '@map-colonies/mc-model-types';
import { faker } from '@faker-js/faker';

export const catalogManagerClientMock = {
  createCatalogMetadata: jest.fn(),
  deleteCatalogMetadata: jest.fn(),
};

export const createFakeMetadata: Pycsw3DCatalogRecord = {
  id: faker.string.uuid(),
} as Pycsw3DCatalogRecord;
