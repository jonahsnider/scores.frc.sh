import type { MatchLevel } from '../schema';
import {
	type FrcEventMatchScore,
	FrcEventMatchWinningAlliance,
	FrcMatchLevel,
	type FrcScheduleMatch,
} from './firstService';

/** Match result data extracted from FIRST API response */
export type MatchResultData = {
	score: number;
	timestamp: number;
	winningTeams: number[];
};

/** Transformed match data ready for database insertion */
export type TransformedMatch = {
	matchNumber: number;
	matchLevel: MatchLevel;
	result: MatchResultData;
};

/**
 * Convert FRC match level to our match level type.
 */
export function convertMatchLevel(frcLevel: FrcMatchLevel): MatchLevel {
	return frcLevel === FrcMatchLevel.Qualification ? 'quals' : 'playoffs';
}

/**
 * Convert a FRC score and schedule match to match result data.
 * For ties (no winning alliance), defaults to treating Blue as the winner.
 */
export function frcScoreToMatchResult(score: FrcEventMatchScore, scheduleMatch: FrcScheduleMatch): MatchResultData {
	// Find the winning alliance color (default to Blue for ties)
	const winningAllianceColor = score.winningAlliance === FrcEventMatchWinningAlliance.Red ? 'Red' : 'Blue';

	// Get the winning alliance object
	const winningAlliance = score.alliances.find((alliance) => alliance.alliance === winningAllianceColor);

	if (!winningAlliance) {
		throw new Error(`Winning alliance ${winningAllianceColor} not found in match ${score.matchNumber}`);
	}

	// Get the team numbers for the winning alliance from the schedule match
	const winningStations =
		winningAllianceColor === 'Red' ? new Set(['Red1', 'Red2', 'Red3']) : new Set(['Blue1', 'Blue2', 'Blue3']);

	const winningTeams = scheduleMatch.teams
		.filter((team) => winningStations.has(team.station))
		// Handle cases where the team number is null (e.g., 2024 GAALB)
		.map((team) => team.teamNumber ?? 0);

	// Parse timestamp - match must be scheduled
	if (!scheduleMatch.startTime) {
		throw new Error(`Match ${score.matchNumber} isn't scheduled`);
	}
	const timestamp = new Date(scheduleMatch.startTime).getTime();

	// Use totalPoints minus foulPoints as the score
	const scoreValue = winningAlliance.totalPoints - winningAlliance.foulPoints;

	return {
		score: scoreValue,
		timestamp,
		winningTeams,
	};
}

/**
 * Transform raw FIRST API schedule and scores into our match format.
 * Filters to only finished matches (those with scores).
 */
export function transformMatches(
	schedule: FrcScheduleMatch[],
	qualsScores: FrcEventMatchScore[],
	playoffsScores: FrcEventMatchScore[],
): TransformedMatch[] {
	// Build hash map: (level, number) -> FrcEventMatchScore
	const scoreMap = new Map<string, FrcEventMatchScore>(
		[qualsScores, playoffsScores].flatMap((matchScores) =>
			matchScores.map((matchScore) => [`${matchScore.matchLevel}:${matchScore.matchNumber}`, matchScore]),
		),
	);

	// Filter to finished matches (those with scores) and transform
	return schedule
		.filter((match) => {
			const key = `${match.tournamentLevel}:${match.matchNumber}`;
			return scoreMap.has(key);
		})
		.map((match) => {
			const key = `${match.tournamentLevel}:${match.matchNumber}`;
			const score = scoreMap.get(key);
			if (!score) {
				throw new Error(`Score not found for match ${key}`);
			}

			return {
				matchNumber: match.matchNumber,
				matchLevel: convertMatchLevel(match.tournamentLevel as FrcMatchLevel),
				result: frcScoreToMatchResult(score, match),
			};
		});
}
