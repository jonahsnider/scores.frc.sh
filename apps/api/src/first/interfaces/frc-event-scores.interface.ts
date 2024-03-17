import type { FrcAlliance } from '../enums/alliance.enum';
import type { MatchLevel } from '../enums/match-level.enum';

export type FrcEventMatchScores = {
	// biome-ignore lint/style/useNamingConvention: This is an external API
	MatchScores: FrcEventMatchScore[];
};

export type FrcEventMatchScore = {
	matchLevel: MatchLevel;
	matchNumber: number;
	alliances: [FrcMatchAllianceScore<FrcAlliance.Blue>, FrcMatchAllianceScore<FrcAlliance.Red>];
};

export type FrcMatchAllianceScore<T extends FrcAlliance> = {
	alliance: T;
	autoPoints: number;
	teleopPoints: number;
	foulCount: number;
	techFoulCount: number;
	adjustPoints: number;
	foulPoints: number;
	rp: number;
	totalPoints: number;
};
