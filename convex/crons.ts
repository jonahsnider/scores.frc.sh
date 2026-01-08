import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';
import { MAX_YEAR, MIN_YEAR } from './lib/constants';

const crons = cronJobs();

for (let year = MIN_YEAR; year <= MAX_YEAR; year++) {
	const isPastYear = year < MAX_YEAR;

	if (isPastYear) {
		// Past years: refresh events monthly
		crons.monthly(
			`Refresh ${year} events`,
			{ day: 1, hourUTC: 0, minuteUTC: 0 },
			internal.events.refreshEventsForYear,
			{ year },
		);

		// Past years: refresh match results weekly
		crons.weekly(
			`Refresh ${year} match results`,
			{ dayOfWeek: 'sunday', hourUTC: 0, minuteUTC: 0 },
			internal.matches.refreshMatchResultsForYear,
			{ year },
		);
	} else {
		// Current year: refresh events daily
		crons.daily(`Refresh ${year} events`, { hourUTC: 0, minuteUTC: 0 }, internal.events.refreshEventsForYear, { year });

		// Current year: refresh match results every 5 minutes
		crons.cron(`Refresh ${year} match results`, '*/5 * * * *', internal.matches.refreshMatchResultsForYear, { year });
	}
}

export default crons;
