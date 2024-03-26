import type { MatchLevel } from '../../first/enums/match-level.enum';
import type { Event } from './event.interface';

export type BaseMatch = {
	event: Event;
	level: MatchLevel;
	number: number;
	timestamp: Date;
};
