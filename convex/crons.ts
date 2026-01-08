import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';
import { MAX_YEAR, MIN_YEAR } from './lib/constants';

const crons = cronJobs();

for (let year = MIN_YEAR; year <= MAX_YEAR; year++) {
	// Refresh events from The Blue Alliance daily at midnight UTC
	crons.daily(`Refresh ${year} events`, { hourUTC: 0, minuteUTC: 0 }, internal.events.refreshEventsForYear, { year });

	// Refresh match results every 5 minutes
	crons.cron(`Refresh ${year} match results`, '*/5 * * * *', internal.matches.refreshMatchResultsForYear, { year });
}

export default crons;
