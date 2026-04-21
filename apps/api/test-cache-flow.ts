import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DashboardDemoSeedService } from './src/dashboard/dashboard-demo-seed.service';

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('Bootstrapping NestJS standalone application...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const seedService = app.get(DashboardDemoSeedService);

  console.log('\n--- CACHE MISS TEST (First Request) ---');
  let startTime = Date.now();
  console.log('Calling DashboardDemoSeedService.seed() - Expecting full provider fetch + DB writes...');
  let result = await seedService.seed();
  let durationMs = Date.now() - startTime;
  console.log(`First request completed in ${durationMs}ms`);
  
  if (result.dashboard && result.dashboard.providers) {
     console.log(`Data sources: Weather -> ${result.dashboard.providers.weather}, Solar -> ${result.dashboard.providers.solar}`);
  }

  console.log('\nWaiting 2 seconds to allow background DB writes to complete...');
  await delay(2000);

  console.log('\n--- CACHE HIT TEST (Second Request) ---');
  startTime = Date.now();
  console.log('Calling DashboardDemoSeedService.seed() again - Expecting < 50ms (Cache Hit) with NO provider fetch...');
  result = await seedService.seed();
  durationMs = Date.now() - startTime;
  console.log(`Second request completed in ${durationMs}ms!`);

  console.log('\nTest finished successfully.');
  await app.close();
}

runTest().catch(console.error);
