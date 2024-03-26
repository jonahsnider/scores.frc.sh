import { MatchLevel } from '@scores.frc.sh/api/src/first/enums/match-level.enum';

export function weekName(weekNumber: number) {
	if (weekNumber === 8) {
		return 'Championship';
	}

	return `Week ${weekNumber}`;
}

export function tbaUrl(year: number, eventCode: string, matchNumber: number, matchLevel: MatchLevel) {
	let urlMatchNumber: string;

	if (matchLevel === MatchLevel.Qualification) {
		urlMatchNumber = `qm${matchNumber}`;
	} else {
		switch (matchNumber) {
			case 14:
			case 15:
			case 16: {
				urlMatchNumber = `f${matchNumber - 13}`;
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
export function formatMatch(level: MatchLevel, number: number, eventCode?: string) {
	const prefix = eventCode ? `${eventCode} ` : '';

	if (level === MatchLevel.Qualification) {
		return `${prefix}Q${number}`;
	}

	switch (number) {
		case 14:
		case 15:
		case 16:
			return `${prefix}Finals ${number - 13}`;
		default:
			return `${prefix}Elims match ${number}`;
	}
}
