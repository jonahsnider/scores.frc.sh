import { BullModule } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { type DefaultJobOptions, Queue } from 'bullmq';
import convert from 'convert';
import type Ioredis from 'ioredis';
import { ConfigService } from '../config/config.service';
import { QUEUE_REDIS_PROVIDER } from '../redis/providers';
import { QueueNames } from './enums/queue-names.enum';

// biome-ignore lint/suspicious/noExplicitAny: This is required
type AnyQueue = Queue<any, any, any>;

@Injectable()
export class QueuesService {
	private static readonly QUEUE_JOB_OPTIONS: Readonly<Record<QueueNames, DefaultJobOptions>> = {
		[QueueNames.FetchEvents]: {
			removeOnComplete: { age: convert(60, 'minutes').to('seconds'), count: 100 },
			removeOnFail: { age: convert(3, 'days').to('seconds'), count: 100 },
			attempts: 5,
			backoff: {
				type: 'exponential',
				delay: convert(30, 'seconds').to('ms'),
			},
		},
		[QueueNames.FetchMatchResults]: {
			removeOnComplete: { age: convert(60, 'minutes').to('seconds'), count: 1000 },
			removeOnFail: { age: convert(3, 'days').to('seconds'), count: 1000 },
			attempts: 5,
			backoff: {
				type: 'exponential',
				delay: convert(15, 'seconds').to('ms'),
			},
		},
	};

	static registerQueue(name: QueueNames) {
		return BullModule.registerQueueAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				name: name,
				connection: {
					username: config.redis.username,
					password: config.redis.password,
					host: config.redis.host,
					port: config.redis.port,
					offlineQueue: false,
					maxRetriesPerRequest: null,
				},
				defaultJobOptions: QueuesService.QUEUE_JOB_OPTIONS[name],
			}),
		});
	}

	private readonly queues: Map<QueueNames, AnyQueue> = new Map();

	constructor(@Inject(QUEUE_REDIS_PROVIDER) private readonly redis: Ioredis) {}

	getAllQueues(): AnyQueue[] {
		return Object.values(QueueNames).map((queueName) => this.getQueue(queueName));
	}

	getQueue<T extends AnyQueue>(queueName: QueueNames): T {
		if (!this.queues.has(queueName)) {
			this.queues.set(
				queueName,
				new Queue(queueName, {
					connection: this.redis,
					defaultJobOptions: QueuesService.QUEUE_JOB_OPTIONS[queueName],
				}),
			);
		}

		// biome-ignore lint/style/noNonNullAssertion: This is safe
		return this.queues.get(queueName)! as T;
	}
}
