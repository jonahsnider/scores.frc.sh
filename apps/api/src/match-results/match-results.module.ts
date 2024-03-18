import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import convert from 'convert';
import { ConfigService } from '../config/config.service';
import { EventsModule } from '../events/events.module';
import { QueueNames } from '../queues/enums/queue-names.enum';
import { FetchMatchResultsProcessor } from './fetch-match-results.processor';
import { MatchResultsService } from './match-results.service';

@Module({
	imports: [
		EventsModule,
		BullModule.registerQueueAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				name: QueueNames.FetchMatchResults,
				connection: {
					username: config.redis.username,
					password: config.redis.password,
					host: config.redis.host,
					port: config.redis.port,
					offlineQueue: false,
					maxRetriesPerRequest: null,
				},
				defaultJobOptions: {
					removeOnComplete: { age: convert(5, 'minutes').to('seconds'), count: 1000 },
					removeOnFail: { age: convert(1, 'hour').to('seconds') },
					attempts: 5,
					backoff: {
						type: 'exponential',
						delay: convert(15, 'seconds').to('ms'),
					},
				},
			}),
		}),
		// BullBoardModule.forFeature({
		// 	name: QueueNames.FetchMatchResults,
		// 	adapter: BullMQAdapter,
		// }),
	],
	providers: [MatchResultsService, FetchMatchResultsProcessor],
	exports: [MatchResultsService],
})
export class MatchResultsModule {}
