import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import type { Server } from 'bun';

export function createContext(_getServer: () => Server, _options: FetchCreateContextFnOptions): Context {
	return {};
}

export type Context = Record<never, never>;
