import { Inject, Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import convert from 'convert';
import { eq } from 'drizzle-orm';
import { ConfigService } from '../config/config.service';
import { Schema } from '../db/index';
import type { Db } from '../db/interfaces/db.interface';
import { DB_PROVIDER } from '../db/providers';
import type { QueueType } from '../events/interfaces/fetch-events-queue.interface';
import { QueueNames } from '../queues/enums/queue-names.enum';
import { QueuesService } from '../queues/queues.service';

@Injectable()
export class CacheManagerService implements OnApplicationBootstrap {
	static readonly YEAR_OLDEST = 2023;
	static readonly YEAR_NEWEST = new Date().getFullYear();

	private static readonly FORCE_REFRESH_IN_DEV = false;

	private static readonly CACHE_REFRESH_INTERVAL_CURRENT_YEAR = convert(1, 'hour');
	private static readonly CACHE_REFRESH_INTERVAL_PAST_YEAR = convert(1, 'week');

	private readonly logger = new Logger(CacheManagerService.name);

	private readonly fetchEventsQueue: QueueType;

	constructor(
		@Inject(ConfigService) private readonly configService: ConfigService,
		@Inject(QueuesService) queuesService: QueuesService,
		@Inject(DB_PROVIDER) private readonly db: Db,
	) {
		this.fetchEventsQueue = queuesService.getQueue(QueueNames.FetchEvents);
	}

	async onApplicationBootstrap(): Promise<void> {
		for (let year = CacheManagerService.YEAR_OLDEST; year <= CacheManagerService.YEAR_NEWEST; year++) {
			const repeatInterval =
				year === CacheManagerService.YEAR_NEWEST
					? CacheManagerService.CACHE_REFRESH_INTERVAL_CURRENT_YEAR
					: CacheManagerService.CACHE_REFRESH_INTERVAL_PAST_YEAR;

			await this.fetchEventsQueue.add(
				`fetch-events-${year}`,
				{ year },
				{
					repeat: {
						every: repeatInterval.to('ms'),
					},
				},
			);
			this.logger.verbose(`Scheduled cache refresh for year ${year}`);
		}

		if (CacheManagerService.FORCE_REFRESH_IN_DEV && this.configService.nodeEnv === 'development') {
			this.logger.log('Scheduling cache refresh right now');
			await this.fetchEventsQueue.add(`fetch-events-${CacheManagerService.YEAR_NEWEST}`, {
				year: CacheManagerService.YEAR_NEWEST,
			});
		}

		this.logger.log('Cache refreshes scheduled');
	}
}
