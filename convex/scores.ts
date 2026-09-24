import { type Infer, v } from 'convex/values';
import type { Doc } from './_generated/dataModel';
import { query } from './functions';
import { filterMatchesToRecordBreaking } from './lib/recordMatches';
import { matchLevelValidator } from './schema';

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
		const [events, recordMatches] = await Promise.all([
			ctx.table('events', 'by_year_and_code', (q) => q.eq('year', args.year)),
			ctx.table('recordMatches', 'by_year', (q) => q.eq('year', args.year)),
		]);
		const worldRecords = filterMatchesToRecordBreaking(recordMatches);

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

		const records = await event.edge('recordMatches');
		return transformMatchToHighScore(filterMatchesToRecordBreaking(records), [event]);
	},
});

function transformMatchToHighScore(records: Doc<'recordMatches'>[], events: Doc<'events'>[]): HighScoreResult[] {
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
