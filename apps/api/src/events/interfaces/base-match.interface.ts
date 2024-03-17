import type { MatchLevel } from '../../first/enums/match-level.enum';

export type BaseMatch = {
	event: {
		year: number;
		code: string;
		weekNumber: number;
	};
	level: MatchLevel;
	number: number;
	timestamp: Date;
};
