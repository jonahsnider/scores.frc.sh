import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import convert from 'convert';
import type Ioredis from 'ioredis';
import { QueueNames } from '../queues/enums/queue-names.enum';
import { REDIS_PROCESSOR_PROVIDER } from '../redis/providers';
import { MatchResultsService } from './match-results.service';

@Module({
	imports: [
		BullModule.registerQueueAsync({
			inject: [REDIS_PROCESSOR_PROVIDER],
			useFactory: (redis: Ioredis) => ({
				name: QueueNames.FetchMatchResults,
				connection: redis,
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
		BullBoardModule.forFeature({
			name: QueueNames.FetchMatchResults,
			adapter: BullMQAdapter,
		}),
	],
	providers: [MatchResultsService],
	exports: [MatchResultsService],
})
export class MatchResultsModule {}
