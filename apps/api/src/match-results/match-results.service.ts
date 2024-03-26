import assert from 'node:assert';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { Schema } from '../db/index';
import type { Db } from '../db/interfaces/db.interface';
import { DB_PROVIDER } from '../db/providers';
import { matchLevelToDb } from '../db/util';
import type { Match } from '../events/interfaces/match.interface';
import { MatchLevel } from '../first/enums/match-level.enum';
import type { TopScoreMatch } from './interfaces/top-score-match.interface';

@Injectable()
export class MatchResultsService {
	private static matchToDbMatch(match: TopScoreMatch, eventInternalId: number): typeof Schema.topScores.$inferInsert {
		return {
			matchNumber: match.number,
			matchLevel: matchLevelToDb(match.level),
			score: match.topScore,
			timestamp: match.timestamp,
			winningTeams: match.winningTeams,
			eventInternalId,
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
			if (
				matches.some(
					(match) => match.event.year !== firstMatch.event.year || match.event.code !== firstMatch.event.code,
				)
			) {
				throw new RangeError('All matches must be for the same event');
			}

			await this.db.transaction(async (tx) => {
				// Upsert event
				const [event] = await tx
					.insert(Schema.events)
					.values([
						{
							code: firstMatch.event.code,
							name: firstMatch.event.name,
							weekNumber: firstMatch.event.weekNumber,
							year: firstMatch.event.year,
							firstCode: firstMatch.event.firstCode,
						},
					])
					.onConflictDoUpdate({
						target: [Schema.events.code, Schema.events.year],
						set: {
							name: firstMatch.event.name,
							weekNumber: firstMatch.event.weekNumber,
							firstCode: firstMatch.event.firstCode,
						},
					})
					.returning({
						internalId: Schema.events.internalId,
					});

				assert(event, 'Event not returned from query');

				// Delete all matches for the event
				await tx.delete(Schema.topScores).where(eq(Schema.topScores.eventInternalId, event.internalId));

				const values = matches.map((match) => MatchResultsService.matchToDbMatch(match, event.internalId));

				await tx.insert(Schema.topScores).values(values);
			});
		}
	}
}
