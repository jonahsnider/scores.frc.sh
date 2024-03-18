import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { TrpcService } from './trpc/trpc.service';

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { abortOnError: process.env.NODE_ENV !== 'development' });

	const configService = app.get(ConfigService);

	const trpcService = app.get(TrpcService);

	trpcService.register(app);

	await app.listen(configService.port);
}
bootstrap();
