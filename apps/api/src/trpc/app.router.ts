import { highScoresRouter } from '../high-scores/high-scores.router';
import { router } from './trpc';

export const appRouter = router({
	highScores: highScoresRouter,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
