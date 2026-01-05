import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Refresh events from The Blue Alliance daily at midnight UTC
crons.daily('Refresh events', { hourUTC: 0, minuteUTC: 0 }, internal.events.refreshAllEvents, {});

crons.cron('Refresh match results', '*/5 * * * *', internal.matches.refreshMatchResults, {});

export default crons;
