import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { CacheManagerModule } from './cache-manager/cache-manager.module';
import { ConfigModule } from './config/config.module';
import { DbModule } from './db/db.module';
import { EventsModule } from './events/events.module';
import { FirstModule } from './first/first.module';
import { HealthModule } from './health/health.module';
import { HighScoresModule } from './high-scores/high-scores.module';
import { MatchResultsModule } from './match-results/match-results.module';
import { QueuesModule } from './queues/queues.module';

import { SentryModule } from '@ntegral/nestjs-sentry';
import { AuthModule } from './auth/auth.module';
import { ConfigService } from './config/config.service';
import { RedisModule } from './redis/redis.module';
import { TbaModule } from './tba/tba.module';
import { TrpcModule } from './trpc/trpc.module';

@Module({
	imports: [
		ConfigModule,
		SentryModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				dsn: config.sentryDsn,
				environment: config.nodeEnv,
			}),
		}),
		DbModule,
		RedisModule,
		BullModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				connection: {
					username: config.redis.username,
					password: config.redis.password,
					host: config.redis.host,
					port: config.redis.port,
				},
			}),
		}),
		QueuesModule,
		EventsModule,
		HighScoresModule,
		MatchResultsModule,
		FirstModule,
		TrpcModule,
		CacheManagerModule,
		HealthModule,
		AuthModule,
		TbaModule,
	],
})
export class AppModule {}
