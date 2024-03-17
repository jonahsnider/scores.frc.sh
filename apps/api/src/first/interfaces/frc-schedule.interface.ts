import type { FrcAlliance } from '../enums/alliance.enum';
import type { MatchLevel } from '../enums/match-level.enum';

export type FrcSchedule = {
	// biome-ignore lint/style/useNamingConvention: This is an external API
	Schedule: FrcScheduleMatch[];
};

export type FrcScheduleMatch = {
	description: string;
	startTime: string;
	matchNumber: 1;
	field: string;
	tournamentLevel: MatchLevel;
	teams: [
		FrcScheduleMatchTeam<FrcAlliance.Red, 1>,
		FrcScheduleMatchTeam<FrcAlliance.Red, 2>,
		FrcScheduleMatchTeam<FrcAlliance.Red, 3>,
		FrcScheduleMatchTeam<FrcAlliance.Blue, 1>,
		FrcScheduleMatchTeam<FrcAlliance.Blue, 2>,
		FrcScheduleMatchTeam<FrcAlliance.Blue, 3>,
	];
};

export type FrcScheduleMatchTeam<T extends FrcAlliance, S extends 1 | 2 | 3> = {
	teamNumber: number;
	station: `${T}${S}`;
	surrogate: boolean;
};
