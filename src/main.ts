import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const dbPath = process.env.DATABASE_PATH || './data/cluecrop.sqlite';
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();
  const port = Number(process.env.PORT || 3000);
  await app.listen(port);
}
bootstrap();
