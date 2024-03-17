import type { Server } from 'bun';
import { Hono } from 'hono';
import { logger as honoLogger } from 'hono/logger';
import { baseLogger } from '../../logger/logger';
import { errorHandler } from '../error-handler';
import type { Env } from '../interfaces/env.interface';
import { healthController } from './health.controller';
import { internalController } from './internal.controller';
import { createTrpcController } from './trpc.controller';

const logger = baseLogger.child({ module: 'server' });

export function createAppController(getServer: () => Server) {
	return (
		new Hono<Env>()
			.onError(errorHandler)
			// Wrap every route in an async_hooks store use for server timing
			.use(
				'*',
				honoLogger((...messages) => logger.info(...messages)),
			)
			.route('health', healthController)
			.route('trpc', createTrpcController(getServer))
			.route('internal', internalController)
	);
}
