import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CacheManagerService } from '../cache-manager/cache-manager.service';
import { MatchLevel } from '../first/enums/match-level.enum';

import { publicProcedure, router } from '../trpc/trpc';
import { HighScoresService } from './high-scores.service';

@Injectable()
export class HighScoresRouter {
	constructor(@Inject(HighScoresService) private readonly highScoresService: HighScoresService) {}

	createRouter() {
		return router({
			getHighScores: publicProcedure
				.input(z.number().int().min(CacheManagerService.YEAR_OLDEST).max(CacheManagerService.YEAR_NEWEST))
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
					const scores = await this.highScoresService.getGlobalHighScores(input);

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
	}
}
