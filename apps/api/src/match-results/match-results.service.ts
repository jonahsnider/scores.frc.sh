import { sql } from 'drizzle-orm';
import { db } from '../db/db';
import { Schema } from '../db/index';
import { matchLevelToDb } from '../db/util';
import { eventsService } from '../events/events.service';
import type { Match } from '../events/interfaces/match.interface';
import { MatchLevel } from '../first/enums/match-level.enum';
import { FetchMatchResultsWorker } from './fetch-match-results.worker';
import type { TopScoreMatch } from './interfaces/top-score-match.interface';

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

	async saveTopScores(matches: TopScoreMatch[]): Promise<void> {
		const values = matches.map(MatchResultsService.matchToDbMatch);

		await db
			.insert(Schema.topScores)
			.values(values)
			.onConflictDoUpdate({
				target: [
					Schema.topScores.year,
					Schema.topScores.eventCode,
					Schema.topScores.matchLevel,
					Schema.topScores.matchNumber,
				],
				set: {
					score: sql`EXCLUDED.score`,
					timestamp: sql`EXCLUDED.timestamp`,
					winningTeams: sql`EXCLUDED.winning_teams`,
				},
			});
	}

	private readonly worker = new FetchMatchResultsWorker(eventsService, this);
}

export const matchResultsService = new MatchResultsService();
