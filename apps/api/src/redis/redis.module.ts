import { Global, Module } from '@nestjs/common';
import Ioredis from 'ioredis';
import { ConfigService } from '../config/config.service';
import { REDIS_PROCESSOR_PROVIDER, REDIS_QUEUE_PROVIDER } from './providers';

@Global()
@Module({
	providers: [
		{
			provide: REDIS_QUEUE_PROVIDER,
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => new Ioredis(configService.redisUrl),
		},
		{
			provide: REDIS_PROCESSOR_PROVIDER,
			inject: [ConfigService],
			useFactory: (configService: ConfigService) =>
				new Ioredis(configService.redisUrl, {
					offlineQueue: false,
					maxRetriesPerRequest: null,
				}),
		},
	],
	exports: [REDIS_QUEUE_PROVIDER, REDIS_PROCESSOR_PROVIDER],
})
export class RedisModule {}
