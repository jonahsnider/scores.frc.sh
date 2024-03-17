import { index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

export enum MatchLevel {
	Qualification = 'QUALIFICATION',
	Playoff = 'PLAYOFF',
}

export const matchLevel = pgEnum('match_level', [MatchLevel.Qualification, MatchLevel.Playoff]);

export const topScores = pgTable(
	'top_scores',
	{
		year: integer('year').notNull(),
		eventCode: text('event_code').notNull(),
		eventWeekNumber: integer('event_week_number').notNull(),
		matchNumber: integer('match_number').notNull(),
		matchLevel: matchLevel('match_level').notNull(),
		score: integer('score').notNull(),
		winningTeams: jsonb('winning_teams').notNull(),
		timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
	},
	(topScores) => ({
		pk: primaryKey({ columns: [topScores.year, topScores.eventCode, topScores.matchLevel, topScores.matchNumber] }),
		timestampIdx: index().on(topScores.timestamp),
		scoreIdx: index().on(topScores.score),
	}),
);
