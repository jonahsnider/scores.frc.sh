import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CacheManagerService } from '../cache-manager/cache-manager.service';
import { MatchLevel } from '../first/enums/match-level.enum';

import { EventsService } from '../events/events.service';
import { publicProcedure, router } from '../trpc/trpc';
import { HighScoresService } from './high-scores.service';

const EventYear = z.number().int().min(CacheManagerService.YEAR_OLDEST).max(CacheManagerService.YEAR_NEWEST);
const EventCode = z.string().min(1).toLowerCase();

const EventMatch = z.object({
	event: z.object({
		code: EventCode,
		weekNumber: z.number().int().nonnegative(),
		name: z.string(),
	}),
	match: z.object({
		number: z.number().int().positive(),
		level: z.nativeEnum(MatchLevel),
	}),
	score: z.number().int().nonnegative(),
	timestamp: z.date(),
	winningTeams: z.array(z.number().int().positive()),
});
@Injectable()
export class HighScoresRouter {
	constructor(
		@Inject(HighScoresService) private readonly highScoresService: HighScoresService,
		@Inject(EventsService) private readonly eventsService: EventsService,
	) {}

	createRouter() {
		return router({
			getHighScores: publicProcedure
				.input(z.object({ year: EventYear, eventCode: EventCode.optional() }))
				.output(EventMatch.array().nullable())
				.query(async ({ input }) => {
					if (input.eventCode) {
						const eventExists = await this.eventsService.eventExists(input.year, input.eventCode);

						if (!eventExists) {
							return null;
						}
					}

					const scores = input.eventCode
						? await this.highScoresService.getEventHighScores(input.year, input.eventCode)
						: await this.highScoresService.getGlobalHighScores(input.year);

					return scores.map((score) => ({
						event: {
							code: score.event.code,
							weekNumber: score.event.weekNumber,
							name: score.event.name,
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
