import { stringToBase64 } from 'uint8array-extras';
import { ResponseError, up } from 'up-fetch';
import { z } from 'zod';
import { env } from './env';

const CURRENT_YEAR = new Date().getFullYear();

const SCORE_DETAILS_NOT_REGISTERED_ERROR_MESSAGE = `The requested service 'FMS.GameSpecific.S${CURRENT_YEAR}.Interfaces.IS${CURRENT_YEAR}GameSpecificScoreDetails' has not been registered. To avoid this exception, either register a component to provide the service, check for service registration using IsRegistered(), or use the ResolveOptional() method to resolve an optional dependency.

See https://autofac.rtfd.io/help/service-not-registered for more info.`;

const BASIC_AUTH_CREDENTIALS = stringToBase64(`${env.FRC_EVENTS_USERNAME}:${env.FRC_EVENTS_API_KEY}`);
const http = up(fetch, () => ({
	baseUrl: 'https://frc-api.firstinspires.org/v3.0',
	headers: {
		Authorization: `Basic ${BASIC_AUTH_CREDENTIALS}`,
	},
}));

/** Match level in the FRC Events API */
export enum FrcMatchLevel {
	Qualification = 'Qualification',
	Playoff = 'Playoff',
}

/** Winning alliance in a match (null represents a tie) */
export enum FrcEventMatchWinningAlliance {
	Red = 1,
	Blue = 2,
}

const FrcEventMatchAlliance = z.object({
	alliance: z.enum(['Red', 'Blue']),
	totalPoints: z.number(),
	foulPoints: z.number(),
});
export type FrcEventMatchAlliance = z.infer<typeof FrcEventMatchAlliance>;

const FrcEventMatchScore = z.object({
	matchLevel: z.enum(['Qualification', 'Playoff']),
	matchNumber: z.number(),
	winningAlliance: z.enum(FrcEventMatchWinningAlliance).nullable(),
	alliances: z.tuple([FrcEventMatchAlliance, FrcEventMatchAlliance]),
});
export type FrcEventMatchScore = z.infer<typeof FrcEventMatchScore>;

const FrcEventMatchScores = z.object({
	MatchScores: FrcEventMatchScore.array(),
});
export type FrcEventMatchScores = z.infer<typeof FrcEventMatchScores>;

const FrcScheduleMatchTeam = z.object({
	// 2024 GAALB is an example of an event where inexplicably the team number is null
	teamNumber: z.number().nullable(),
	station: z.enum(['Red1', 'Red2', 'Red3', 'Blue1', 'Blue2', 'Blue3']),
});
export type FrcScheduleMatchTeam = z.infer<typeof FrcScheduleMatchTeam>;

const FrcScheduleMatch = z.object({
	matchNumber: z.number(),
	tournamentLevel: z.enum(['Qualification', 'Playoff']),
	teams: z.array(FrcScheduleMatchTeam),
	startTime: z.string().nullable(),
});
export type FrcScheduleMatch = z.infer<typeof FrcScheduleMatch>;

const FrcSchedule = z.object({
	Schedule: z.array(FrcScheduleMatch),
});
export type FrcSchedule = z.infer<typeof FrcSchedule>;

export async function listEventScores(
	year: number,
	eventCode: string,
	level: FrcMatchLevel,
): Promise<FrcEventMatchScores> {
	try {
		const response = await http(`${year}/scores/${eventCode}/${level}`, {
			schema: FrcEventMatchScores,
		});

		return response;
	} catch (error) {
		if (
			error instanceof ResponseError &&
			error.status === 500 &&
			error.data === SCORE_DETAILS_NOT_REGISTERED_ERROR_MESSAGE
		) {
			return {
				MatchScores: [],
			};
		}

		throw error;
	}
}

export async function getSchedule(year: number, eventCode: string): Promise<FrcSchedule> {
	const qualSchedule = await http(`${year}/schedule/${eventCode}`, {
		schema: FrcSchedule,
		params: { tournamentLevel: FrcMatchLevel.Qualification },
	});
	const playoffSchedule = await http(`${year}/schedule/${eventCode}`, {
		schema: FrcSchedule,
		params: { tournamentLevel: FrcMatchLevel.Playoff },
	});

	return {
		Schedule: [...qualSchedule.Schedule, ...playoffSchedule.Schedule],
	};
}
