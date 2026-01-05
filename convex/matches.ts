import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalAction } from './_generated/server';
import { internalMutation, internalQuery } from './functions';
import { FrcMatchLevel, getSchedule, listEventScores } from './lib/firstService';
import { transformMatches } from './lib/matchTransform';
import { matchLevelValidator } from './schema';

const MIN_YEAR = 2023;

/**
 * Fetch matches from FIRST API for a specific event.
 * Returns transformed match data ready for database insertion.
 */
async function fetchMatchesFromFirstApi(year: number, firstEventCode: string) {
	const schedule = await getSchedule(year, firstEventCode);
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
 */
export const getEventsNeedingRefresh = internalQuery({
	args: {
		year: v.number(),
	},
	returns: v.array(v.string()),
	handler: async (ctx, args) => {
		// Get all events for the year
		const events = await ctx
			.table('events', 'by_year_and_code', (q) => q.eq('year', args.year))
			.map(async (event) => ({
				...event,
				matches: await event.edge('matches'),
			}));

		const incompleteEvents = events.filter(
			(event) =>
				event.matches === undefined ||
				event.matches.length === 0 ||
				event.matches.some((match) => match.result === undefined),
		);

		return incompleteEvents.map((event) => event.firstCode);
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

		const currentYear = new Date().getFullYear();

		for (let year = MIN_YEAR; year <= currentYear; year++) {
			// Get events that need refresh
			const eventsToRefresh = await ctx.runQuery(internal.matches.getEventsNeedingRefresh, { year });

			console.info(`Found ${eventsToRefresh.length} events for year ${year} needing match refresh`);

			for (const event of eventsToRefresh) {
				try {
					await ctx.runAction(internal.matches.refreshMatchesForEvent, {
						year,
						firstEventCode: event,
					});
				} catch (error) {
					console.error(`Error refreshing matches for ${year} ${event}`, error);
					// Continue with other events even if one fails
				}
			}
		}

		console.info('Refreshed match results');
		return null;
	},
});
