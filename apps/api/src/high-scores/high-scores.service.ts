import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { Schema } from '../db/index';
import type { Db } from '../db/interfaces/db.interface';
import { DB_PROVIDER } from '../db/providers';
import { matchLevelFromDb } from '../db/util';
import type { TopScoreMatch } from '../match-results/interfaces/top-score-match.interface';

@Injectable()
export class HighScoresService {
	private static dbTopScoreToTopScoreMatch(row: typeof Schema.topScores.$inferSelect): TopScoreMatch {
		return {
			event: {
				code: row.eventCode,
				year: row.year,
				weekNumber: row.eventWeekNumber,
			},
			number: row.matchNumber,
			timestamp: row.timestamp,
			topScore: row.score,
			winningTeams: row.winningTeams as number[],
			level: matchLevelFromDb(row.matchLevel),
		};
	}

	constructor(@Inject(DB_PROVIDER) private readonly db: Db) {}

	async getGlobalHighScores(year: number): Promise<TopScoreMatch[]> {
		// Get every top scoring match we have stored
		const topScoringMatches = await this.db
			.select()
			.from(Schema.topScores)
			.where(eq(Schema.topScores.year, year))
			.orderBy(asc(Schema.topScores.timestamp));

		// Filter any matches that aren't the world record
		const worldRecords: (typeof Schema.topScores.$inferSelect)[] = [];
		let record = Number.NEGATIVE_INFINITY;

		for (const match of topScoringMatches) {
			if (match.score > record) {
				record = match.score;
				worldRecords.push(match);
			}
		}

		return worldRecords.map(HighScoresService.dbTopScoreToTopScoreMatch);
	}

	async getEventHighScores(year: number, eventCode: string): Promise<TopScoreMatch[]> {
		const eventTopScores = await this.db
			.select()
			.from(Schema.topScores)
			.where(and(eq(Schema.topScores.eventCode, eventCode), eq(Schema.topScores.year, year)));

		return eventTopScores.map(HighScoresService.dbTopScoreToTopScoreMatch);
	}
}
