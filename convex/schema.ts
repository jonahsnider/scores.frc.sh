import { type Infer, v } from 'convex/values';
import { defineEnt, defineEntSchema, getEntDefinitions } from 'convex-ents';

/**
 * Match level enum - qualification matches or playoff matches
 */
export const matchLevelValidator = v.union(v.literal('quals'), v.literal('playoffs'));
export type MatchLevel = Infer<typeof matchLevelValidator>;

const matchResultValidator = v.object({
	score: v.number(),
	winningTeams: v.array(v.number()),
	timestamp: v.number(),
});

const schema = defineEntSchema({
	events: defineEnt({
		year: v.number(),
		code: v.string(),
		weekNumber: v.number(),
		name: v.string(),
		firstCode: v.string(),
	})
		.index('by_year_and_code', ['year', 'code'])
		.index('by_year_and_first_code', ['year', 'firstCode'])
		.edges('matches', { to: 'matches', ref: 'eventId' }),

	matches: defineEnt({
		matchNumber: v.number(),
		matchLevel: matchLevelValidator,
		result: v.optional(matchResultValidator),
	})
		.edge('event', { to: 'events', field: 'eventId' })
		.index('by_result', ['result']),
});

export default schema;

export const entDefinitions = getEntDefinitions(schema);

export const matchWithResultValidator = schema.tables.matches.validator.omit('result').extend({
	result: matchResultValidator,
	_id: v.id('matches'),
	_creationTime: v.number(),
});
export type MatchWithResult = Infer<typeof matchWithResultValidator>;

export const eventWithMatchesValidator = schema.tables.events.validator.extend({
	matches: v.array(matchWithResultValidator),
});
export type EventWithMatches = Infer<typeof eventWithMatchesValidator>;
