import 'reflect-metadata';
import { Metrics } from '@map-colonies/telemetry';
import { container } from 'tsyringe';
import { tracing } from './common/tracing';
import { SERVICES } from './common/constants';
import { getApp } from './app';

async function main(): Promise<void> {
  const app = getApp();
  await app.run();

  //stop tracing and metrics when app finish running
  const metrics = container.resolve<Metrics>(SERVICES.METRICS);
  await Promise.all([metrics.stop(), tracing.stop()]);
}

void main();
