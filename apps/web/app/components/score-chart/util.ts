import { formatDistance } from 'date-fns';
import { Temporal } from 'temporal-polyfill';
import type { MatchLevel } from '@/app/api/api';

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

export function formatRecordHeldFor(durationString: string, eventCode?: string) {
	const duration = Temporal.Duration.from(durationString);

	if (duration.years > 1) {
		return `held until ${eventCode ? 'event' : 'season'} end`;
	}

	return `held for ${formatDistance(0, duration.total({ unit: 'milliseconds' }))}`;
}
