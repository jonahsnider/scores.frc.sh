import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import type Ioredis from 'ioredis';
import { CacheManagerModule } from './cache-manager/cache-manager.module';
import { ConfigModule } from './config/config.module';
import { DbModule } from './db/db.module';
import { EventsModule } from './events/events.module';
import { FirstModule } from './first/first.module';
import { HealthModule } from './health/health.module';
import { HighScoresModule } from './high-scores/high-scores.module';
import { MatchResultsModule } from './match-results/match-results.module';
import { QueuesModule } from './queues/queues.module';
import { REDIS_QUEUE_PROVIDER } from './redis/providers';
import { RedisModule } from './redis/redis.module';
import { TrpcModule } from './trpc/trpc.module';

@Module({
	imports: [
		ConfigModule,
		DbModule,
		RedisModule,
		BullModule.forRootAsync({
			inject: [REDIS_QUEUE_PROVIDER],
			useFactory: (redis: Ioredis) => ({ connection: redis }),
		}),
		...(process.env.NODE_ENV === 'development'
			? [
					BullBoardModule.forRoot({
						route: '/internal/queues',
						adapter: ExpressAdapter,
					}),
			  ]
			: []),
		QueuesModule,
		EventsModule,
		HighScoresModule,
		MatchResultsModule,
		FirstModule,
		TrpcModule,
		CacheManagerModule,
		HealthModule,
	],
})
export class AppModule {}
