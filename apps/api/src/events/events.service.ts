import assert from 'node:assert';
import { partition } from '@jonahsnider/util';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, notInArray, sql } from 'drizzle-orm';
import { HTTPError } from 'ky';
import { Schema } from '../db/index';
import type { Db } from '../db/interfaces/db.interface';
import { DB_PROVIDER } from '../db/providers';
import { FrcAlliance } from '../first/enums/alliance.enum';
import { MatchLevel } from '../first/enums/match-level.enum';
import { FirstService } from '../first/first.service';
import type { FrcEventMatchScore } from '../first/interfaces/frc-event-scores.interface';
import type { FrcSchedule, FrcScheduleMatch } from '../first/interfaces/frc-schedule.interface';
import { TbaEventType } from '../tba/enums/tba-event-type.enum';
import type { TbaEvent } from '../tba/interfaces/tba-event.interface';
import { TbaService } from '../tba/tba.service';
import type { Event } from './interfaces/event.interface';
import type { Match } from './interfaces/match.interface';

export type ScheduleLookup = (level: MatchLevel, number: number) => FrcScheduleMatch | undefined;

@Injectable()
export class EventsService {
	private static readonly IGNORED_EVENT_TYPES: ReadonlySet<TbaEventType> = new Set([
		TbaEventType.Offseason,
		TbaEventType.Unlabeled,
		TbaEventType.Preseason,
	]);

	private static getWeekNumber(event: TbaEvent): number {
		if (event.week !== null) {
			// TBA week numbers are 0-indexed
			return event.week + 1;
		}

		switch (event.event_type) {
			case TbaEventType.CmpDivision:
			case TbaEventType.CmpFinals:
				// Champs is week 0
				return 8;
			default:
				throw new RangeError(`Event ${event.year} ${event.event_code} is missing a week number`);
		}
	}

	private static firstMatchToMatch(event: Event, match: FrcEventMatchScore, lookup: ScheduleLookup): Match {
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
		@Inject(TbaService) private readonly tbaService: TbaService,
		@Inject(DB_PROVIDER) private readonly db: Db,
	) {}

	async getMatches(eventCode: string, year: number): Promise<Match[]> {
		const [event] = await this.db
			.select()
			.from(Schema.events)
			.where(and(eq(Schema.events.year, year), eq(Schema.events.code, eventCode)));

		assert(event, `Event ${year} ${eventCode} not found in DB`);

		const [qualScores, playoffScores, schedule] = await Promise.all([
			this.firstService.listEventScores(event.year, event.firstCode, MatchLevel.Qualification).catch((error) => {
				if (error instanceof HTTPError && error.response.status === 404) {
					// TBA is often wrong about FIRST event codes for district events, causing these requests to 404
					return {
						// biome-ignore lint/style/useNamingConvention: This can't be renamed
						MatchScores: [],
					};
				}

				throw error;
			}),
			this.firstService.listEventScores(event.year, event.firstCode, MatchLevel.Playoff).catch((error) => {
				if (error instanceof HTTPError && error.response.status === 404) {
					// TBA is often wrong about FIRST event codes for district events, causing these requests to 404
					return {
						// biome-ignore lint/style/useNamingConvention: This can't be renamed
						MatchScores: [],
					};
				}

				throw error;
			}),
			this.firstService.getSchedule(event.year, event.firstCode).catch((error) => {
				if (error instanceof HTTPError && error.response.status === 404) {
					// TBA is often wrong about FIRST event codes for district events, causing these requests to 404
					return {
						// biome-ignore lint/style/useNamingConvention: This can't be renamed
						Schedule: [],
					};
				}

				throw error;
			}),
		]);

		const lookup = EventsService.createScheduleLookup(schedule);

		const qualMatches = qualScores.MatchScores.map((match) => EventsService.firstMatchToMatch(event, match, lookup));
		const playoffMatches = playoffScores.MatchScores.map((match) =>
			EventsService.firstMatchToMatch(event, match, lookup),
		);

		return [...qualMatches, ...playoffMatches];
	}

	async listEvents(year: number): Promise<TbaEvent[]> {
		const rawEvents = await this.tbaService.listEvents(year);

		const filtered = rawEvents.filter(
			(event) => event.first_event_code && !EventsService.IGNORED_EVENT_TYPES.has(event.event_type),
		);

		await this.saveEvents(filtered);

		return filtered;
	}

	private async saveEvents(events: TbaEvent[]): Promise<Event[]> {
		const dbEvents = await this.db
			.insert(Schema.events)
			.values(
				events.map((event) => {
					const eventWeek = EventsService.getWeekNumber(event);

					const firstCode = event.first_event_code;
					assert(firstCode, `Event ${event.event_code} is missing a first event code`);

					return {
						year: event.year,
						code: event.event_code,
						weekNumber: eventWeek,
						firstCode: firstCode,
						// This intentionally filters out short names that are empty strings
						name: event.short_name || event.name,
					};
				}),
			)
			.onConflictDoUpdate({
				target: [Schema.events.year, Schema.events.code],
				set: {
					weekNumber: sql`EXCLUDED.week_number`,
					firstCode: sql`EXCLUDED.first_code`,
					name: sql`EXCLUDED.name`,
				},
			})
			.returning();

		return dbEvents.map((event) => ({
			code: event.code,
			firstCode: event.firstCode,
			name: event.name,
			weekNumber: event.weekNumber,
			year: event.year,
		}));
	}

	async purgeOrphanedEvents(year: number): Promise<string[]> {
		const events = await this.listEvents(year);

		const deleted = await this.db
			.delete(Schema.events)
			.where(
				and(
					eq(Schema.events.year, year),
					notInArray(
						Schema.events.code,
						events.map((event) => event.event_code),
					),
				),
			)
			.returning({
				eventCode: Schema.events.code,
			});

		return [...new Set(deleted.map((score) => score.eventCode))];
	}

	async eventExists(year: number, code: string): Promise<boolean> {
		const [row] = await this.db
			.select()
			.from(Schema.events)
			.where(and(eq(Schema.events.year, year), eq(Schema.events.code, code.toLowerCase())))
			.limit(1);

		return Boolean(row);
	}
}
