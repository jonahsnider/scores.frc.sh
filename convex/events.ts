import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalAction } from './_generated/server';
import { internalMutation } from './functions';
import { MAX_YEAR, MIN_YEAR } from './lib/constants';
import { getEventsForYear, type TbaEvent, TbaEventType } from './lib/tbaService';

/** Event types to ignore when syncing from TBA */
const IGNORED_EVENT_TYPES = new Set([TbaEventType.Offseason, TbaEventType.Preseason, TbaEventType.Unlabeled]);

/**
 * Normalize TBA week number to a 1-indexed week number.
 * TBA uses 0-indexed weeks, championship events have null week.
 */
function normalizeTbaWeek(event: TbaEvent): number {
	if (event.week !== null) {
		return event.week + 1;
	}

	// Championship events have null week
	if (event.event_type === TbaEventType.CmpDivision || event.event_type === TbaEventType.CmpFinals) {
		return 8;
	}

	throw new RangeError(`Event ${event.year} ${event.event_code} is missing a week number`);
}

/**
 * Internal action that refreshes events from The Blue Alliance for a specific year.
 * This action fetches event data from TBA and saves it to the database.
 */
export const refreshEventsForYear = internalAction({
	args: {
		year: v.number(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		console.info(`Refreshing events for ${args.year}`);

		// Fetch events from TBA
		console.debug(`Fetching events from TBA for ${args.year}`);
		const tbaEvents = await getEventsForYear(args.year);
		console.debug(`Fetched ${tbaEvents.length} events from TBA for ${args.year}`);

		// Filter events: exclude ignored types and events without FIRST codes
		const filteredEvents = tbaEvents.filter(
			(event): event is TbaEvent & { first_event_code: string } =>
				event.first_event_code !== null && !IGNORED_EVENT_TYPES.has(event.event_type),
		);
		console.debug(
			`Filtered to ${filteredEvents.length} events for ${args.year} (excluded ${tbaEvents.length - filteredEvents.length} offseason/preseason/unlabeled events)`,
		);

		// Transform to our event format
		const events = filteredEvents.map((event) => ({
			year: event.year,
			code: event.event_code.toUpperCase(),
			name: event.name,
			firstCode: event.first_event_code.toUpperCase(),
			weekNumber: normalizeTbaWeek(event),
		}));

		// Save events to database
		console.debug(`Saving ${events.length} events to database for ${args.year}`);
		await ctx.runMutation(internal.events.saveEventsForYear, {
			year: args.year,
			events,
		});

		console.info(`Refreshed events for ${args.year}`);
		return null;
	},
});

/**
 * Internal mutation that saves events to the database for a specific year.
 * This performs an upsert operation and removes orphaned events.
 */
export const saveEventsForYear = internalMutation({
	args: {
		year: v.number(),
		events: v.array(
			v.object({
				year: v.number(),
				code: v.string(),
				name: v.string(),
				firstCode: v.string(),
				weekNumber: v.number(),
			}),
		),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		console.debug(`Loading existing events for ${args.year}`);

		// Get existing events for this year
		const existingEvents = await ctx.table('events', 'by_year_and_code', (q) => q.eq('year', args.year));
		console.debug(`Found ${existingEvents.length} existing events for ${args.year}`);

		// Create a map of existing events by code for quick lookup
		const existingEventsByCode = new Map(existingEvents.map((event) => [event.code, event]));

		// Track which codes we've seen in the new data
		const newEventCodes = new Set<string>();

		// Upsert events
		let insertedCount = 0;
		let updatedCount = 0;
		for (const event of args.events) {
			newEventCodes.add(event.code);

			const existingEvent = existingEventsByCode.get(event.code);

			if (existingEvent) {
				// Update existing event
				await existingEvent.patch({
					name: event.name,
					firstCode: event.firstCode,
					weekNumber: event.weekNumber,
				});
				updatedCount++;
			} else {
				// Insert new event
				await ctx.table('events').insert({
					year: event.year,
					code: event.code,
					name: event.name,
					firstCode: event.firstCode,
					weekNumber: event.weekNumber,
				});
				insertedCount++;
			}
		}

		// Delete orphaned events (events in DB but not in TBA response)
		let deletedCount = 0;
		for (const existingEvent of existingEvents) {
			if (!newEventCodes.has(existingEvent.code)) {
				console.warn(`Deleting orphaned event ${existingEvent.code} for ${args.year}`);
				await existingEvent.delete();
				deletedCount++;
			}
		}

		console.info(`Inserted ${insertedCount} events for ${args.year}`);
		if (updatedCount > 0) {
			console.debug(`Updated ${updatedCount} existing events for ${args.year}`);
		}
		if (deletedCount > 0) {
			console.info(`Deleted ${deletedCount} orphaned events for ${args.year}`);
		}

		return null;
	},
});

/**
 * Internal action that refreshes events for all years from MIN_YEAR to current year.
 * This is called by the daily cron job.
 */
export const refreshAllEvents = internalAction({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		console.info('Refreshing events');
		console.debug(`Refreshing events for years ${MIN_YEAR} to ${MAX_YEAR}`);

		for (let year = MIN_YEAR; year <= MAX_YEAR; year++) {
			try {
				await ctx.runAction(internal.events.refreshEventsForYear, { year });
			} catch (error) {
				console.error(`Error refreshing events for ${year}`, error);
				// Continue with other years even if one fails
			}
		}

		console.info('Refreshed all events');
		return null;
	},
});
