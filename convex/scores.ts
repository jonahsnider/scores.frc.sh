import { type Infer, v } from 'convex/values';
import { internal } from './_generated/api';
import type { Doc } from './_generated/dataModel';
import { internalQuery, query } from './functions';
import { type EventWithMatches, type MatchWithResult, matchLevelValidator, matchWithResultValidator } from './schema';

/**
 * Validator for a single high score record.
 */
const highScoreResultValidator = v.object({
	matchNumber: v.number(),
	matchLevel: matchLevelValidator,
	event: v.object({
		code: v.string(),
		firstCode: v.string(),
		name: v.string(),
		weekNumber: v.number(),
		year: v.number(),
	}),
	result: v.object({
		score: v.number(),
		timestamp: v.number(),
		winningTeams: v.array(v.number()),
		/** Duration in milliseconds that this record was held, or null if it's the current record */
		recordHeldFor: v.union(v.number(), v.null()),
	}),
});

type HighScoreResult = Infer<typeof highScoreResultValidator>;

/**
 * Helper function to compute record-breaking matches from a list of match results.
 */
function filterMatchesToRecordBreaking(events: EventWithMatches[]): MatchWithResult[] {
	// Sort by timestamp ascending
	const sortedMatches = events
		.flatMap((event) => event.matches)
		.sort((a, b) => a.result.timestamp - b.result.timestamp);

	// Find record-breaking matches
	let currentRecord = -1;
	return sortedMatches.filter((match) => {
		if (match.result.score > currentRecord) {
			currentRecord = match.result.score;
			return true;
		}
		return false;
	});
}

/**
 * Get world record high scores for a specific year.
 *
 * Returns all record-breaking matches ordered by when they occurred,
 * where each match set a new high score that exceeded all previous scores.
 */
export const worldRecordsByYear = query({
	args: {
		year: v.number(),
	},
	returns: v.array(highScoreResultValidator),
	handler: async (ctx, args): Promise<HighScoreResult[]> => {
		// Get all events for the year
		const events = await ctx.table('events', 'by_year_and_code', (q) => q.eq('year', args.year));

		// Get records for each event using the cached eventRecords query
		const allEventRecords = await Promise.all(
			events.map((event) =>
				ctx.runQuery(internal.scores.eventRecordMatches, {
					year: args.year,
					eventCode: event.code,
				}),
			),
		);

		// Combine events with their cached per-event records to filter for world records
		const eventsWithMatches: EventWithMatches[] = events.map((event, idx) => ({
			...event.doc(),
			matches: allEventRecords[idx] ?? [],
		}));

		// Filter to only the actual world record-breaking matches
		const worldRecords = filterMatchesToRecordBreaking(eventsWithMatches);

		return transformMatchToHighScore(worldRecords, events);
	},
});

/**
 * Get high scores for a specific event.
 *
 * Returns all record-breaking matches for a specific event,
 * ordered by when they occurred.
 *
 * Returns null if the event doesn't exist.
 */
export const eventRecords = query({
	args: {
		year: v.number(),
		eventCode: v.string(),
	},
	returns: v.nullable(v.array(highScoreResultValidator)),
	handler: async (ctx, args): Promise<HighScoreResult[] | null> => {
		// Get the event
		const event = await ctx
			.table('events', 'by_year_and_code', (q) => q.eq('year', args.year).eq('code', args.eventCode))
			.unique();

		if (!event) {
			return null;
		}

		// Get record-breaking matches
		const matches = await ctx.runQuery(internal.scores.eventRecordMatches, {
			year: args.year,
			eventCode: args.eventCode,
		});

		if (!matches) {
			return null;
		}

		return transformMatchToHighScore(matches, [event]);
	},
});

export const eventRecordMatches = internalQuery({
	args: {
		year: v.number(),
		eventCode: v.string(),
	},
	returns: v.nullable(v.array(matchWithResultValidator)),
	handler: async (ctx, args) => {
		const [event] = await ctx
			.table('events', 'by_year_and_code', (q) => q.eq('year', args.year).eq('code', args.eventCode))
			.map(async (event) => ({
				...event,
				// TODO: See if we can add an index on this instead of a filter
				matches: (await event.edge('matches').filter((q) => q.neq(q.field('result'), undefined))) as MatchWithResult[],
			}));

		if (!event) {
			return null;
		}

		return filterMatchesToRecordBreaking([event]);
	},
});

function transformMatchToHighScore(records: MatchWithResult[], events: Doc<'events'>[]): HighScoreResult[] {
	const eventMap = new Map(events.map((event) => [event._id, event]));

	return records.map((record, idx) => {
		const event = eventMap.get(record.eventId);
		if (!event) {
			throw new TypeError(`Event not found for id: ${record.eventId}`);
		}

		const nextRecord = records[idx + 1];
		const recordHeldFor = nextRecord ? nextRecord.result.timestamp - record.result.timestamp : null;

		return {
			matchNumber: record.matchNumber,
			matchLevel: record.matchLevel,
			event: {
				code: event.code,
				firstCode: event.firstCode,
				name: event.name,
				weekNumber: event.weekNumber,
				year: event.year,
			},
			result: {
				score: record.result.score,
				timestamp: record.result.timestamp,
				winningTeams: record.result.winningTeams,
				recordHeldFor,
			},
		};
	});
}
