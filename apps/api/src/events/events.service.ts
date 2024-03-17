import assert from 'node:assert';
import { partition } from '@jonahsnider/util';
import { and, eq, notInArray } from 'drizzle-orm';
import { db } from '../db/db';
import { Schema } from '../db/index';
import { FrcAlliance } from '../first/enums/alliance.enum';
import { MatchLevel } from '../first/enums/match-level.enum';
import { firstService } from '../first/first.service';
import type { FrcEventMatchScore } from '../first/interfaces/frc-event-scores.interface';
import type { FrcSchedule, FrcScheduleMatch } from '../first/interfaces/frc-schedule.interface';
import { FetchEventsWorker } from './fetch-events.worker';
import type { Match } from './interfaces/match.interface';

export type ScheduleLookup = (level: MatchLevel, number: number) => FrcScheduleMatch | undefined;

export class EventsService {
	private static firstMatchToMatch(
		event: {
			year: number;
			code: string;
			weekNumber: number;
		},
		match: FrcEventMatchScore,
		lookup: ScheduleLookup,
	): Match {
		const [blue, red] = match.alliances;

		const scheduleMatch = lookup(match.matchLevel, match.matchNumber);
		assert(
			scheduleMatch,
			`Match ${match.matchLevel} ${match.matchNumber} not found in schedule for event ${event.year} ${event.code}`,
		);
		const matchTeams = scheduleMatch.teams;

		const [blueTeams, redTeams] = partition(matchTeams, (team) => team.station.startsWith(FrcAlliance.Blue));

		return {
			event,
			level: match.matchLevel,
			number: match.matchNumber,
			timestamp: new Date(scheduleMatch.startTime),
			scores: {
				blue: blue.totalPoints - blue.foulPoints,
				red: red.totalPoints - red.foulPoints,
			},
			teams: {
				blue: blueTeams.map((team) => team.teamNumber),
				red: redTeams.map((team) => team.teamNumber),
			},
		};
	}

	private static createScheduleLookup(schedule: FrcSchedule): ScheduleLookup {
		const serialize = (match: FrcScheduleMatch) => `${match.tournamentLevel}-${match.matchNumber}`;

		const lookup = new Map<string, FrcScheduleMatch>(schedule.Schedule.map((match) => [serialize(match), match]));

		return (level: MatchLevel, number: number) => lookup.get(`${level}-${number}`);
	}

	private readonly worker = new FetchEventsWorker(this);

	async getScores(event: { year: number; code: string; weekNumber: number }): Promise<Match[]> {
		const [qualScores, playoffScores, schedule] = await Promise.all([
			firstService.listEventScores(event.year, event.code, MatchLevel.Qualification),
			firstService.listEventScores(event.year, event.code, MatchLevel.Playoff),
			firstService.getSchedule(event.year, event.code),
		]);

		const lookup = EventsService.createScheduleLookup(schedule);

		const qualMatches = qualScores.MatchScores.map((match) => EventsService.firstMatchToMatch(event, match, lookup));
		const playoffMatches = playoffScores.MatchScores.map((match) =>
			EventsService.firstMatchToMatch(event, match, lookup),
		);

		return [...qualMatches, ...playoffMatches];
	}

	async purgeOrphanedEvents(year: number): Promise<void> {
		const events = await firstService.listEvents(year);

		await db.delete(Schema.topScores).where(
			and(
				eq(Schema.topScores.year, year),
				notInArray(
					Schema.topScores.eventCode,
					events.Events.map((event) => event.code),
				),
			),
		);
	}
}

export const eventsService = new EventsService();
