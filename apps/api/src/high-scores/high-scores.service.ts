import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { Schema } from '../db/index';
import type { Db } from '../db/interfaces/db.interface';
import { DB_PROVIDER } from '../db/providers';
import { matchLevelFromDb } from '../db/util';
import type { TopScoreMatch } from '../match-results/interfaces/top-score-match.interface';

@Injectable()
export class HighScoresService {
	private static dbTopScoreToTopScoreMatch(
		row: {
			topScores: typeof Schema.topScores.$inferSelect;
			events: typeof Schema.events.$inferSelect;
		},
		nextRow?: typeof Schema.topScores.$inferSelect,
	): TopScoreMatch {
		return {
			event: {
				code: row.events.code,
				year: row.events.year,
				weekNumber: row.events.weekNumber,
				firstCode: row.events.firstCode,
				name: row.events.name,
			},
			number: row.topScores.matchNumber,
			timestamp: row.topScores.timestamp,
			topScore: row.topScores.score,
			winningTeams: row.topScores.winningTeams as number[],
			level: matchLevelFromDb(row.topScores.matchLevel),
			recordHeldFor: nextRow ? nextRow.timestamp.getTime() - row.topScores.timestamp.getTime() : 'forever',
		};
	}

	constructor(@Inject(DB_PROVIDER) private readonly db: Db) {}

	async getGlobalHighScores(year: number): Promise<TopScoreMatch[]> {
		// Get every top scoring match we have stored
		const topScoringMatches = await this.db
			.select()
			.from(Schema.topScores)
			.innerJoin(Schema.events, eq(Schema.topScores.eventInternalId, Schema.events.internalId))
			.where(eq(Schema.events.year, year))
			.orderBy(asc(Schema.topScores.timestamp));

		// Filter any matches that aren't the world record
		const worldRecords: {
			topScores: typeof Schema.topScores.$inferSelect;
			events: typeof Schema.events.$inferSelect;
		}[] = [];
		let record = Number.NEGATIVE_INFINITY;

		for (const match of topScoringMatches) {
			if (match.top_scores.score > record) {
				record = match.top_scores.score;
				worldRecords.push({
					events: match.events,
					topScores: match.top_scores,
				});
			}
		}

		return worldRecords.map((rows, index) =>
			HighScoresService.dbTopScoreToTopScoreMatch(rows, worldRecords[index + 1]?.topScores),
		);
	}

	async getEventHighScores(year: number, eventCode: string): Promise<TopScoreMatch[]> {
		const eventTopScores = await this.db
			.select()
			.from(Schema.topScores)
			.innerJoin(Schema.events, eq(Schema.topScores.eventInternalId, Schema.events.internalId))
			.where(and(eq(Schema.events.code, eventCode.toLowerCase()), eq(Schema.events.year, year)));

		return eventTopScores.map((rows, index) =>
			HighScoresService.dbTopScoreToTopScoreMatch(
				{
					events: rows.events,
					topScores: rows.top_scores,
				},
				eventTopScores[index + 1]?.top_scores,
			),
		);
	}
}
