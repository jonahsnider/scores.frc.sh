import { z } from 'zod';
import { CacheManager } from '../cache-manager/cache-manager.service';
import { MatchLevel } from '../first/enums/match-level.enum';
import { publicProcedure, router } from '../trpc/trpc';
import { highScoresService } from './high-scores.service';

export const highScoresRouter = router({
	getHighScores: publicProcedure
		.input(z.number().int().min(CacheManager.YEAR_OLDEST).max(CacheManager.YEAR_NEWEST))
		.output(
			z.array(
				z.object({
					event: z.object({
						code: z.string(),
						weekNumber: z.number().int().positive(),
					}),
					match: z.object({
						number: z.number().int().positive(),
						level: z.nativeEnum(MatchLevel),
					}),
					score: z.number().int().positive(),
					timestamp: z.date(),
					winningTeams: z.array(z.number().int().positive()),
				}),
			),
		)
		.query(async ({ input }) => {
			const scores = await highScoresService.getGlobalHighScores(input);

			return scores.map((score) => ({
				event: {
					code: score.event.code,
					weekNumber: score.event.weekNumber,
				},
				match: {
					number: score.number,
					level: score.level,
				},
				score: score.topScore,
				timestamp: score.timestamp,
				winningTeams: score.winningTeams,
			}));
		}),
});
