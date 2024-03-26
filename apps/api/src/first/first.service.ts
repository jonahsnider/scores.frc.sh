import { Inject, Injectable } from '@nestjs/common';
import ky, { type KyInstance } from 'ky';
import { ConfigService } from '../config/config.service';
import { MatchLevel } from './enums/match-level.enum';
import type { FrcEventMatchScores } from './interfaces/frc-event-scores.interface';
import type { FrcSchedule } from './interfaces/frc-schedule.interface';

@Injectable()
export class FirstService {
	private readonly http: KyInstance;

	constructor(@Inject(ConfigService) configService: ConfigService) {
		const basicAuthToken = Buffer.from(
			`${configService.frcEventsApi.username}:${configService.frcEventsApi.password}`,
			'utf8',
		).toString('base64');

		this.http = ky.extend({
			headers: {
				authorization: `Basic ${basicAuthToken}`,
			},
			prefixUrl: 'https://frc-api.firstinspires.org/v3.0',
		});
	}

	async listEventScores(year: number, eventCode: string, level: MatchLevel): Promise<FrcEventMatchScores> {
		const response = await this.http.get(
			`${encodeURIComponent(year)}/scores/${encodeURIComponent(eventCode)}/${encodeURIComponent(level)}`,
		);

		return response.json<FrcEventMatchScores>();
	}

	async getSchedule(year: number, eventCode: string): Promise<FrcSchedule> {
		const qualSearchParams = new URLSearchParams({ tournamentLevel: MatchLevel.Qualification });
		const playoffSearchParams = new URLSearchParams({ tournamentLevel: MatchLevel.Playoff });

		const [qualResponse, playoffResponse] = await Promise.all([
			this.http.get(`${encodeURIComponent(year)}/schedule/${encodeURIComponent(eventCode)}?${qualSearchParams}`),
			this.http.get(`${encodeURIComponent(year)}/schedule/${encodeURIComponent(eventCode)}?${playoffSearchParams}`),
		]);

		const [qual, playoff] = await Promise.all([qualResponse.json<FrcSchedule>(), playoffResponse.json<FrcSchedule>()]);

		return {
			// biome-ignore lint/style/useNamingConvention: This is an external API
			Schedule: [...qual.Schedule, ...playoff.Schedule],
		};
	}
}
