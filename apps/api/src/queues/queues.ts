import { Queue, type QueueOptions } from 'bullmq';
import convert from 'convert';
import type * as fetchEvents from '../events/interfaces/fetch-events-queue.interface';
import type * as fetchMatchResults from '../match-results/interfaces/fetch-match-results.queue.interface';
import { queueRedisConnection } from '../redis/redis';
import { QueueNames } from './enums/queue-names.enum';

const BASE_QUEUE_OPTIONS = {
	connection: queueRedisConnection,
} as const satisfies QueueOptions;

export const fetchEventsQueue: fetchEvents.QueueType = new Queue(QueueNames.FetchEvents, {
	...BASE_QUEUE_OPTIONS,
	defaultJobOptions: {
		removeOnComplete: { age: convert(5, 'minutes').to('seconds'), count: 100 },
		removeOnFail: { age: convert(1, 'hour').to('seconds') },
		attempts: 5,
		backoff: {
			type: 'exponential',
			delay: convert(30, 'seconds').to('ms'),
		},
	},
});
export const fetchMatchResultsQueue: fetchMatchResults.QueueType = new Queue(QueueNames.FetchMatchResults, {
	...BASE_QUEUE_OPTIONS,
	defaultJobOptions: {
		removeOnComplete: { age: convert(5, 'minutes').to('seconds'), count: 1000 },
		removeOnFail: { age: convert(1, 'hour').to('seconds') },
		attempts: 5,
		backoff: {
			type: 'exponential',
			delay: convert(15, 'seconds').to('ms'),
		},
	},
});

export const ALL_QUEUES = [fetchEventsQueue, fetchMatchResultsQueue];
