import { formatDistance } from 'date-fns';
import type { MatchLevel } from '../../convex/schema';

export function weekName(weekNumber: number) {
	if (weekNumber === 8) {
		return 'Championship';
	}

	return `Week ${weekNumber}`;
}

export function tbaUrl(year: number, eventCode: string, matchNumber: number, matchLevel: MatchLevel) {
	let urlMatchNumber: string;

	if (matchLevel === 'quals') {
		urlMatchNumber = `qm${matchNumber}`;
	} else {
		switch (matchNumber) {
			case 14:
			case 15:
			case 16: {
				urlMatchNumber = `f1m${matchNumber - 13}`;
				break;
			}
			default: {
				urlMatchNumber = `sf${matchNumber}m1`;
				break;
			}
		}
	}

	return `https://www.thebluealliance.com/match/${year}${encodeURIComponent(
		eventCode.toLowerCase(),
	)}_${urlMatchNumber}`;
}

// Note: this assume 2023 double elims bracket
export function formatMatch(level: MatchLevel, number: number) {
	if (level === 'quals') {
		return `Q${number}`;
	}

	switch (number) {
		case 14:
		case 15:
		case 16:
			return `Finals ${number - 13}`;
		default:
			return `Elims M${number}`;
	}
}

/**
 * Format the duration a record was held for.
 * @param durationMs Duration in milliseconds, or null if the record is still held
 * @param eventCode If provided, the record is for a specific event (affects wording)
 */
export function formatRecordHeldFor(durationMs: number | null, eventCode?: string) {
	if (durationMs === null) {
		return `held until ${eventCode ? 'event' : 'season'} end`;
	}

	// More than ~1 year in milliseconds
	const oneYearMs = 365 * 24 * 60 * 60 * 1000;
	if (durationMs > oneYearMs) {
		return `held until ${eventCode ? 'event' : 'season'} end`;
	}

	return `held for ${formatDistance(0, durationMs)}`;
}
