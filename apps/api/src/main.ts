import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { TrpcService } from './trpc/trpc.service';

const app = await NestFactory.create(AppModule, { abortOnError: process.env['NODE_ENV'] !== 'development' });

const trpcService = app.get(TrpcService);

trpcService.register(app);

const configService = app.get(ConfigService);

await app.listen(configService.port);
