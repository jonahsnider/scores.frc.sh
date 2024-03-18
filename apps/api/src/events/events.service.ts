import assert from 'node:assert';
import { partition } from '@jonahsnider/util';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, notInArray } from 'drizzle-orm';
import { Schema } from '../db/index';
import type { Db } from '../db/interfaces/db.interface';
import { DB_PROVIDER } from '../db/providers';
import { FrcAlliance } from '../first/enums/alliance.enum';
import { MatchLevel } from '../first/enums/match-level.enum';
import { FirstService } from '../first/first.service';
import type { FrcEventMatchScore } from '../first/interfaces/frc-event-scores.interface';
import type { FrcSchedule, FrcScheduleMatch } from '../first/interfaces/frc-schedule.interface';
import type { Match } from './interfaces/match.interface';

export type ScheduleLookup = (level: MatchLevel, number: number) => FrcScheduleMatch | undefined;

@Injectable()
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

	constructor(
		@Inject(FirstService) private readonly firstService: FirstService,
		@Inject(DB_PROVIDER) private readonly db: Db,
	) {}

	async getMatches(event: { year: number; code: string; weekNumber: number }): Promise<Match[]> {
		const [qualScores, playoffScores, schedule] = await Promise.all([
			this.firstService.listEventScores(event.year, event.code, MatchLevel.Qualification),
			this.firstService.listEventScores(event.year, event.code, MatchLevel.Playoff),
			this.firstService.getSchedule(event.year, event.code),
		]);

		const lookup = EventsService.createScheduleLookup(schedule);

		const qualMatches = qualScores.MatchScores.map((match) => EventsService.firstMatchToMatch(event, match, lookup));
		const playoffMatches = playoffScores.MatchScores.map((match) =>
			EventsService.firstMatchToMatch(event, match, lookup),
		);

		return [...qualMatches, ...playoffMatches];
	}

	async purgeOrphanedEvents(year: number): Promise<string[]> {
		const events = await this.firstService.listEvents(year);

		const deleted = await this.db
			.delete(Schema.topScores)
			.where(
				and(
					eq(Schema.topScores.year, year),
					notInArray(
						Schema.topScores.eventCode,
						events.Events.map((event) => event.code),
					),
				),
			)
			.returning({
				eventCode: Schema.topScores.eventCode,
			});

		return deleted.map((score) => score.eventCode);
	}

	async eventExists(year: number, code: string): Promise<boolean> {
		const [row] = await this.db
			.select()
			.from(Schema.topScores)
			.where(and(eq(Schema.topScores.year, year), eq(Schema.topScores.eventCode, code)))
			.limit(1);

		return Boolean(row);
	}
}
