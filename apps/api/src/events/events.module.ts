import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import convert from 'convert';
import type Ioredis from 'ioredis';
import { FirstModule } from '../first/first.module';
import { QueueNames } from '../queues/enums/queue-names.enum';
import { REDIS_PROCESSOR_PROVIDER } from '../redis/providers';
import { EventsService } from './events.service';

@Module({
	imports: [
		FirstModule,
		BullModule.registerQueueAsync({
			inject: [REDIS_PROCESSOR_PROVIDER],
			useFactory: (redis: Ioredis) => ({
				name: QueueNames.FetchEvents,
				connection: redis,
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
		BullBoardModule.forFeature({
			name: QueueNames.FetchEvents,
			adapter: BullMQAdapter,
		}),
	],
	providers: [EventsService],
	exports: [EventsService],
})
export class EventsModule {}
