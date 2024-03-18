import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Inject, type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import type { Router } from 'express';
import { QueuesService } from './queues.service';

const BASE_PATH = '/internal/queues';

@Module({
	providers: [QueuesService],
	exports: [QueuesService],
})
export class QueuesModule implements NestModule {
	constructor(@Inject(QueuesService) private readonly queuesService: QueuesService) {}

	configure(consumer: MiddlewareConsumer) {
		const serverAdapter = new ExpressAdapter();

		createBullBoard({
			queues: this.queuesService.getAllQueues().map((queue) => new BullMQAdapter(queue)),
			serverAdapter,
		});

		const router = serverAdapter.setBasePath(BASE_PATH).getRouter() as Router;

		// TODO: Add authentication

		consumer.apply(router).forRoutes(BASE_PATH);
	}
}
