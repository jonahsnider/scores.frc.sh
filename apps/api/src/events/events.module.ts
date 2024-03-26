import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import convert from 'convert';
import { ConfigService } from '../config/config.service';
import { FirstModule } from '../first/first.module';
import { QueueNames } from '../queues/enums/queue-names.enum';
import { QueuesModule } from '../queues/queues.module';
import { TbaModule } from '../tba/tba.module';
import { EventsService } from './events.service';
import { FetchEventsProcessor } from './fetch-events.processor';

@Module({
	imports: [
		FirstModule,
		TbaModule,
		QueuesModule,
		BullModule.registerQueueAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				name: QueueNames.FetchEvents,
				connection: {
					username: config.redis.username,
					password: config.redis.password,
					host: config.redis.host,
					port: config.redis.port,
					offlineQueue: false,
					maxRetriesPerRequest: null,
				},
				defaultJobOptions: {
					removeOnComplete: { age: convert(5, 'minutes').to('seconds'), count: 100 },
					removeOnFail: { age: convert(1, 'hour').to('seconds') },
					attempts: 5,
					backoff: {
						type: 'exponential',
						delay: convert(30, 'seconds').to('ms'),
					},
				},
			}),
		}),
		// BullBoardModule.forFeature({
		// 	name: QueueNames.FetchEvents,
		// 	adapter: BullMQAdapter,
		// }),
	],
	providers: [EventsService, FetchEventsProcessor],
	exports: [EventsService],
})
export class EventsModule {}
