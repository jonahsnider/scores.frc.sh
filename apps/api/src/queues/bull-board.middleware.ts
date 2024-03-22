import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Inject, Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response, Router } from 'express';
import { QueuesService } from './queues.service';

@Injectable()
export class BullBoardMiddleware implements NestMiddleware {
	static readonly BASE_PATH = '/internal/queues';

	private readonly serverAdapter = new ExpressAdapter();
	private readonly router: Router;

	constructor(@Inject(QueuesService) private readonly queuesService: QueuesService) {
		createBullBoard({
			queues: this.queuesService.getAllQueues().map((queue) => new BullMQAdapter(queue)),
			serverAdapter: this.serverAdapter,
		});

		this.router = this.serverAdapter.setBasePath(BullBoardMiddleware.BASE_PATH).getRouter() as Router;
	}

	use(req: Request, res: Response, next: NextFunction) {
		this.router(req, res, next);
	}
}
