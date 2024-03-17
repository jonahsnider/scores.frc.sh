import type { Server } from 'bun';
import { inspectRoutes } from 'hono/dev';
import { configService } from '../config/config.service';
import { baseLogger } from '../logger/logger';
import { createAppController } from './controllers/app.controller';

export class ApiService {
	private readonly logger = baseLogger.child({ module: 'server' });

	private initialized = false;

	initServer(): void {
		if (this.initialized) {
			throw new Error('Server already initialized');
		}

		this.initialized = true;

		let server: Server | undefined = undefined;

		// This is like, super unsafe, but also should never cause an issue
		// The reason for this silliness is that there is a circular dependency between Bun.serve requiring us to set a fetch function, and the fetch function requiring the server to be created
		const getServer = (): Server => server as Server;

		const appController = createAppController(getServer);

		// biome-ignore lint/correctness/noUndeclaredVariables: This is a global
		server = Bun.serve({
			fetch: appController.fetch,
			port: configService.port,
			development: configService.nodeEnv === 'development',
		});

		this.logger.info(`Listening at ${server.url.toString()}`);

		if (configService.nodeEnv === 'development') {
			this.logger.debug('Routes:');
			for (const route of inspectRoutes(appController)) {
				if (!route.isMiddleware) {
					this.logger.debug(`${route.method} ${route.path}`);
				}
			}
		}
	}
}

export const apiService = new ApiService();
