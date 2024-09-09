import 'reflect-metadata';
import { getApp } from './app';

void getApp()
.then((app) => {
  app.run();
})
.catch((error: Error) => {
  console.error(error);
});
