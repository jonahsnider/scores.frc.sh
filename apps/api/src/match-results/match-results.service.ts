import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { Schema } from '../db/index';
import type { Db } from '../db/interfaces/db.interface';
import { DB_PROVIDER } from '../db/providers';
import { matchLevelToDb } from '../db/util';
import type { Match } from '../events/interfaces/match.interface';
import { MatchLevel } from '../first/enums/match-level.enum';
import type { TopScoreMatch } from './interfaces/top-score-match.interface';

@Injectable()
export class MatchResultsService {
	private static matchToDbMatch(match: TopScoreMatch): typeof Schema.topScores.$inferSelect {
		return {
			eventCode: match.event.code,
			eventWeekNumber: match.event.weekNumber,
			matchNumber: match.number,
			matchLevel: matchLevelToDb(match.level),
			score: match.topScore,
			timestamp: match.timestamp,
			winningTeams: match.winningTeams,
			year: match.event.year,
		};
	}

	/**  Go through the event matches and keep only the event high score as of that match */
	static keepTopScores(scores: Match[]): TopScoreMatch[] {
		// Sort by match number
		const sortedMatches: Match[] = scores.toSorted((a, b) => {
			if (a.level === b.level) {
				return a.number - b.number;
			}

			if (a.level === MatchLevel.Qualification && b.level === MatchLevel.Playoff) {
				return -1;
			}

			return 1;
		});

		const topScores: TopScoreMatch[] = [];
		let topScore = Number.NEGATIVE_INFINITY;

		for (const match of sortedMatches) {
			const topScoreMatch = MatchResultsService.highestScoreForMatch(match);

			if (topScoreMatch.topScore > topScore) {
				topScores.push(topScoreMatch);
				topScore = topScoreMatch.topScore;
			}
		}

		return topScores;
	}

	private static highestScoreForMatch(match: Match): TopScoreMatch {
		// Note that this assumes a tie doesn't ever happen
		const blueWon = match.scores.blue > match.scores.red;

		return {
			event: match.event,
			level: match.level,
			number: match.number,
			timestamp: match.timestamp,
			topScore: Math.max(match.scores.blue, match.scores.red),
			winningTeams: blueWon ? match.teams.blue : match.teams.red,
		};
	}

	constructor(@Inject(DB_PROVIDER) private readonly db: Db) {}

	async saveTopScores(matches: TopScoreMatch[]): Promise<void> {
		const [firstMatch] = matches;

		if (firstMatch) {
			const values = matches.map(MatchResultsService.matchToDbMatch);

			await this.db.transaction(async (tx) => {
				// Clear out all matches for this event, in case there are any orphaned matches
				await tx
					.delete(Schema.topScores)
					.where(
						and(
							eq(Schema.topScores.year, firstMatch.event.year),
							eq(Schema.topScores.eventCode, firstMatch.event.code),
							eq(Schema.topScores.matchLevel, matchLevelToDb(firstMatch.level)),
						),
					);

				await tx.insert(Schema.topScores).values(values);
			});
		}
	}
}
