import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import type Ioredis from 'ioredis';
import { QUEUE_REDIS_PROVIDER } from '../redis/providers';
import { QueueNames } from './enums/queue-names.enum';

// biome-ignore lint/suspicious/noExplicitAny: This is required
type AnyQueue = Queue<any, any, any>;

@Injectable()
export class QueuesService {
	private readonly queues: Map<QueueNames, AnyQueue> = new Map();

	constructor(@Inject(QUEUE_REDIS_PROVIDER) private readonly redis: Ioredis) {}

	getQueue<T extends AnyQueue>(queueName: QueueNames): T {
		if (!this.queues.has(queueName)) {
			this.queues.set(queueName, new Queue(queueName, { connection: this.redis }));
		}

		// biome-ignore lint/style/noNonNullAssertion: This is safe
		return this.queues.get(queueName)! as T;
	}

	getAllQueues(): AnyQueue[] {
		return Object.values(QueueNames).map((queueName) => this.getQueue(queueName));
	}
}
