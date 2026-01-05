import { ConvexQueryClient } from '@convex-dev/react-query';
import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';
import { ConvexProvider } from 'convex/react';
import { cleanEnv, str } from 'envalid';
import { routeTree } from './routeTree.gen';

export function getRouter() {
	const env = cleanEnv(import.meta.env, {
		VITE_CONVEX_URL: str({ desc: 'The URL of the Convex instance' }),
	});

	const convexQueryClient = new ConvexQueryClient(env.VITE_CONVEX_URL);

	const queryClient: QueryClient = new QueryClient({
		defaultOptions: {
			queries: {
				queryKeyHashFn: convexQueryClient.hashFn(),
				queryFn: convexQueryClient.queryFn(),
			},
		},
	});
	convexQueryClient.connect(queryClient);

	const router = routerWithQueryClient(
		createRouter({
			routeTree,
			defaultPreload: 'intent',
			context: { queryClient },
			scrollRestoration: true,
			Wrap: ({ children }) => <ConvexProvider client={convexQueryClient.convexClient}>{children}</ConvexProvider>,
		}),
		queryClient,
	);

	return router;
}
