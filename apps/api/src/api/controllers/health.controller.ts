import { Hono } from 'hono';

export const healthController = new Hono().get('/', (context) => {
	return context.json({
		status: 'ok',
	});
});
