import { Global, Module } from '@nestjs/common';
import Ioredis from 'ioredis';
import { ConfigService } from '../config/config.service';
import { QUEUE_REDIS_PROVIDER } from './providers';

@Global()
@Module({
	providers: [
		{
			provide: QUEUE_REDIS_PROVIDER,
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => new Ioredis(configService.redis.url),
		},
	],
	exports: [QUEUE_REDIS_PROVIDER],
})
export class RedisModule {}
