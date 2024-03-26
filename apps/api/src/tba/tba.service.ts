import { Inject, Injectable } from '@nestjs/common';
import type { KyInstance } from 'ky';
import ky from 'ky';
import { ConfigService } from '../config/config.service';
import type { TbaEvent } from './interfaces/tba-event.interface';

@Injectable()
export class TbaService {
	private readonly http: KyInstance;

	constructor(@Inject(ConfigService) configService: ConfigService) {
		this.http = ky.extend({
			headers: {
				'X-TBA-Auth-Key': configService.tbaApiKey,
			},
			prefixUrl: 'https://www.thebluealliance.com/api/v3',
		});
	}

	async listEvents(year: number): Promise<TbaEvent[]> {
		const response = await this.http.get(`events/${year}`);

		return response.json<TbaEvent[]>();
	}
}
