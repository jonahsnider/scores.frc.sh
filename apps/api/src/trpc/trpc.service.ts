import { type INestApplication, Inject, Injectable } from '@nestjs/common';
import * as trpcExpress from '@trpc/server/adapters/express';
import cors from 'cors';
import { ConfigService } from '../config/config.service';
import { AppRouter } from './app.router';

@Injectable()
export class TrpcService {
	constructor(
		@Inject(AppRouter) private readonly appRouter: AppRouter,
		@Inject(ConfigService) private readonly configService: ConfigService,
	) {}

	register(app: INestApplication) {
		app.use(
			'/trpc',
			cors({
				origin: this.configService.websiteUrl,
			}),
			trpcExpress.createExpressMiddleware({ router: this.appRouter.createRouter() }),
		);
	}
}
