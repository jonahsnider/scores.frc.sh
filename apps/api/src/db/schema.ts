import {
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	serial,
	text,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core';

export enum MatchLevel {
	Qualification = 'QUALIFICATION',
	Playoff = 'PLAYOFF',
}

export const matchLevel = pgEnum('match_level', [MatchLevel.Qualification, MatchLevel.Playoff]);

export const topScores = pgTable(
	'top_scores',
	{
		matchNumber: integer('match_number').notNull(),
		matchLevel: matchLevel('match_level').notNull(),
		score: integer('score').notNull(),
		winningTeams: jsonb('winning_teams').notNull(),
		timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
		eventInternalId: integer('event_internal_id')
			.references(() => events.internalId, { onDelete: 'cascade', onUpdate: 'cascade' })
			.notNull(),
	},
	(topScores) => ({
		pk: primaryKey({ columns: [topScores.eventInternalId, topScores.matchLevel, topScores.matchNumber] }),
		timestampIdx: index().on(topScores.timestamp),
		scoreIdx: index().on(topScores.score),
		eventInternalIdIdx: index().on(topScores.eventInternalId),
	}),
);

export const events = pgTable(
	'events',
	{
		internalId: serial('internal_id').primaryKey().notNull(),
		year: integer('year').notNull(),
		code: text('code').notNull(),
		weekNumber: integer('week_number').notNull(),
		name: text('name').notNull(),
		firstCode: text('first_code').notNull(),
	},
	(events) => ({
		yearCodeIdx: uniqueIndex().on(events.year, events.code),
	}),
);
