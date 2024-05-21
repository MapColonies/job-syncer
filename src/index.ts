import 'reflect-metadata';
import { getApp } from './app';

function main(): void {
  const app = getApp();

  app.run();
}

void main();
