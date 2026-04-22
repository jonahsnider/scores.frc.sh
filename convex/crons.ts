import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';
import { MAX_YEAR, MIN_YEAR } from './lib/constants';

const crons = cronJobs();

// The FRC season runs from Jan 1 to May 7. We encode this directly into cron
// expressions so the schedule stays correct without relying on periodic
// redeploys to re-evaluate dynamic JS.
//
// Since cron doesn't support cross-field ranges (e.g. "Jan 1 through May 7"),
// we split in-season jobs into two entries:
//   - Jan 1 - Apr 30: months 1-4, any day
//   - May 1 - May 7:  month 5,    days 1-7
const IN_SEASON_MONTHS_JAN_APR = '1-4';
const IN_SEASON_DAYS_MAY = '1-7';
const IN_SEASON_MONTH_MAY = '5';

// Past-year refreshes: MAX_YEAR is evaluated at deploy time, so newly-past
// years only start getting monthly refreshes after the next deploy. This is
// acceptable because historical data changes rarely.
for (let year = MIN_YEAR; year < MAX_YEAR; year++) {
	crons.monthly(`Refresh ${year} events`, { day: 1, hourUTC: 0, minuteUTC: 0 }, internal.events.refreshEventsForYear, {
		year,
	});

	crons.monthly(
		`Refresh ${year} match results`,
		{ day: 1, hourUTC: 0, minuteUTC: 0 },
		internal.matches.refreshMatchResultsForYear,
		{ year },
	);
}

// Current-season refreshes: the target year is resolved at invocation time
// inside the internal action, so these crons continue to work correctly across
// year boundaries without any redeploy.
crons.cron(
	'Refresh current-year events (Jan-Apr)',
	`0 0 * ${IN_SEASON_MONTHS_JAN_APR} *`,
	internal.events.refreshEventsForCurrentYear,
);
crons.cron(
	'Refresh current-year events (May 1-7)',
	`0 0 ${IN_SEASON_DAYS_MAY} ${IN_SEASON_MONTH_MAY} *`,
	internal.events.refreshEventsForCurrentYear,
);

crons.cron(
	'Refresh current-year match results (Jan-Apr)',
	`*/5 * * ${IN_SEASON_MONTHS_JAN_APR} *`,
	internal.matches.refreshMatchResultsForCurrentYear,
);
crons.cron(
	'Refresh current-year match results (May 1-7)',
	`*/5 * ${IN_SEASON_DAYS_MAY} ${IN_SEASON_MONTH_MAY} *`,
	internal.matches.refreshMatchResultsForCurrentYear,
);

export default crons;
