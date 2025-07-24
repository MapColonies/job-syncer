import 'reflect-metadata';
import { getApp } from './app';

function main(): void {
  const app = getApp();

  app
    .run()
    .then()
    .catch((error) => {
      console.error(error);
    });
}

void main();
