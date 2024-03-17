import { Hono } from 'hono';
import { queuesController } from './queues.controller';

export const internalController = new Hono().route('queues', queuesController);
