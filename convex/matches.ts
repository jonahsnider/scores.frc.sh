import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalAction } from './_generated/server';
import { internalMutation, internalQuery } from './functions';
import { MAX_YEAR, MIN_YEAR } from './lib/constants';
import { FrcMatchLevel, getSchedule, listEventScores } from './lib/firstService';
import { transformMatches } from './lib/matchTransform';
import { matchLevelValidator } from './schema';

/**
 * Fetch matches from FIRST API for a specific event.
 * Returns transformed match data ready for database insertion.
 */
async function fetchMatchesFromFirstApi(year: number, firstEventCode: string) {
	const schedule = await getSchedule(year, firstEventCode);

	if (schedule.Schedule.length === 0) {
		return [];
	}

	const qualsMatchResults = await listEventScores(year, firstEventCode, FrcMatchLevel.Qualification);
	const playoffsMatchResults = await listEventScores(year, firstEventCode, FrcMatchLevel.Playoff);

	return transformMatches(schedule.Schedule, qualsMatchResults.MatchScores, playoffsMatchResults.MatchScores);
}

/**
 * Internal action that fetches matches from FIRST API for a specific event.
 * This action fetches schedule and score data and saves it to the database.
 */
export const refreshMatchesForEvent = internalAction({
	args: {
		year: v.number(),
		firstEventCode: v.string(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		console.info(`Refreshing matches for ${args.year} ${args.firstEventCode}`);

		console.debug(`Fetching schedule and scores from FIRST API for ${args.year} ${args.firstEventCode}`);
		const matches = await fetchMatchesFromFirstApi(args.year, args.firstEventCode);

		console.debug(`Found ${matches.length} finished matches for ${args.year} ${args.firstEventCode}`);

		console.debug(`Saving ${matches.length} matches to database for ${args.year} ${args.firstEventCode}`);
		await ctx.runMutation(internal.matches.saveMatchesForEvent, {
			year: args.year,
			firstEventCode: args.firstEventCode,
			matches,
		});

		console.info(`Refreshed matches for ${args.year} ${args.firstEventCode}`);
		return null;
	},
});

/**
 * Internal mutation that saves matches to the database for a specific event.
 * This performs an upsert operation for matches and their results.
 */
export const saveMatchesForEvent = internalMutation({
	args: {
		year: v.number(),
		firstEventCode: v.string(),
		matches: v.array(
			v.object({
				matchNumber: v.number(),
				matchLevel: matchLevelValidator,
				result: v.union(
					v.object({
						score: v.number(),
						timestamp: v.number(),
						winningTeams: v.array(v.number()),
					}),
					v.null(),
				),
			}),
		),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		// Get the event by year and FIRST code
		const event = await ctx.table('events').getX('by_year_and_first_code', args.year, args.firstEventCode);

		console.debug(`Loading existing matches for ${args.year} ${args.firstEventCode}`);

		// Get existing matches for this event
		const existingMatches = await event.edgeX('matches');
		console.debug(`Found ${existingMatches.length} existing matches for ${args.year} ${args.firstEventCode}`);

		// Create a map of existing matches by level and number for quick lookup
		const existingMatchesByKey = new Map(
			existingMatches.map((match) => [`${match.matchLevel}:${match.matchNumber}`, match]),
		);

		// Track which keys we've seen in the new data
		const newMatchKeys = new Set<string>();

		// Upsert matches and their results
		let insertedCount = 0;
		let updatedCount = 0;
		let resultsInsertedCount = 0;
		let resultsUpdatedCount = 0;

		for (const match of args.matches) {
			const key = `${match.matchLevel}:${match.matchNumber}`;
			newMatchKeys.add(key);

			const existingMatch = existingMatchesByKey.get(key);

			if (existingMatch) {
				// Match already exists, check if we need to update result
				if (match.result) {
					if (existingMatch.result) {
						resultsUpdatedCount++;
					} else {
						resultsInsertedCount++;
					}

					// Get writable ent

					await ctx
						.table('matches')
						.getX(existingMatch._id)
						.patch({
							result: {
								score: match.result.score,
								timestamp: match.result.timestamp,
								winningTeams: match.result.winningTeams,
							},
						});
				}
				updatedCount++;
			} else {
				// Insert new match with optional result
				await ctx.table('matches').insert({
					eventId: event._id,
					matchNumber: match.matchNumber,
					matchLevel: match.matchLevel,
					result: match.result ?? undefined,
				});
				insertedCount++;

				if (match.result) {
					resultsInsertedCount++;
				}
			}
		}

		// Delete orphaned matches (matches in DB but not in FIRST API response)
		let deletedCount = 0;
		for (const existingMatch of existingMatches) {
			const key = `${existingMatch.matchLevel}:${existingMatch.matchNumber}`;
			if (!newMatchKeys.has(key)) {
				console.warn(`Deleting orphaned match ${key} for ${args.year} ${args.firstEventCode}`);
				// Get writable ent and delete
				const matchToDelete = await ctx.table('matches').getX(existingMatch._id);
				await matchToDelete.delete();
				deletedCount++;
			}
		}

		console.info(`Inserted ${insertedCount} matches, updated ${updatedCount} for ${args.year} ${args.firstEventCode}`);
		if (resultsInsertedCount > 0 || resultsUpdatedCount > 0) {
			console.debug(`Results: ${resultsInsertedCount} inserted, ${resultsUpdatedCount} updated`);
		}
		if (deletedCount > 0) {
			console.info(`Deleted ${deletedCount} orphaned matches for ${args.year} ${args.firstEventCode}`);
		}

		return null;
	},
});

/**
 * Internal query that returns events with missing or incomplete match data.
 * Used by the refresh job to know which events need updating.
 *
 * This function is optimized to use the by_result index to efficiently find
 * matches missing results, avoiding a full table scan of all matches.
 */
export const getEventsNeedingRefresh = internalQuery({
	args: {
		year: v.number(),
	},
	returns: v.array(v.string()),
	handler: async (ctx, args) => {
		// Query 1: Get matches missing results
		// This only reads matches where result === undefined
		const matchesMissingResults = await ctx
			.table('matches', 'by_result', (q) => q.eq('result', undefined))
			.map(async (match) => {
				const event = await match.edge('event');
				return { year: event.year, firstCode: event.firstCode };
			});

		// Filter to only matches from the requested year and collect unique event codes
		const eventFirstCodes = new Set(
			matchesMissingResults.filter((match) => match.year === args.year).map((match) => match.firstCode),
		);

		// Query 2: Get events with no matches at all
		const allEvents = await ctx.table('events', 'by_year_and_code', (q) => q.eq('year', args.year));
		for (const event of allEvents) {
			const match = await event.edge('matches').first();
			if (!match) {
				eventFirstCodes.add(event.firstCode);
			}
		}

		return Array.from(eventFirstCodes);
	},
});

/**
 * Internal action that refreshes matches for all events that need updating for a given year.
 */
export const refreshMatchResultsForYear = internalAction({
	args: {
		year: v.number(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		console.info(`Refreshing match results for year ${args.year}`);

		// Get events that need refresh
		const eventsToRefresh = await ctx.runQuery(internal.matches.getEventsNeedingRefresh, { year: args.year });

		console.info(`Found ${eventsToRefresh.length} events for year ${args.year} needing match refresh`);

		for (const event of eventsToRefresh) {
			try {
				await ctx.runAction(internal.matches.refreshMatchesForEvent, {
					year: args.year,
					firstEventCode: event,
				});
			} catch (error) {
				console.error(`Error refreshing matches for ${args.year} ${event}`, error);
				// Continue with other events even if one fails
			}
		}

		console.info(`Refreshed match results for year ${args.year}`);
		return null;
	},
});

/**
 * Internal action that refreshes matches for all events that need updating.
 * This is called by the cron job.
 */
export const refreshMatchResults = internalAction({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		console.info('Refreshing match results');

		for (let year = MIN_YEAR; year <= MAX_YEAR; year++) {
			await ctx.runAction(internal.matches.refreshMatchResultsForYear, { year });
		}

		console.info('Refreshed match results');
		return null;
	},
});
