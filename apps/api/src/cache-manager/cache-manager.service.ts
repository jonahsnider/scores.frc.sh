import { Inject, Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import convert from 'convert';
import { ConfigService } from '../config/config.service';
import type { QueueType } from '../events/interfaces/fetch-events-queue.interface';
import { QueueNames } from '../queues/enums/queue-names.enum';
import { QueuesService } from '../queues/queues.service';
import { YEAR_NEWEST, YEAR_OLDEST } from './cache-manager.constants';

@Injectable()
export class CacheManagerService implements OnApplicationBootstrap {
	private static readonly FORCE_REFRESH_IN_DEV = false;

	private static readonly CACHE_REFRESH_INTERVAL_CURRENT_YEAR = convert(1, 'hour');
	private static readonly CACHE_REFRESH_INTERVAL_PAST_YEAR = convert(1, 'week');

	private readonly logger = new Logger(CacheManagerService.name);

	private readonly fetchEventsQueue: QueueType;

	constructor(
		@Inject(ConfigService) private readonly configService: ConfigService,
		@Inject(QueuesService) queuesService: QueuesService,
	) {
		this.fetchEventsQueue = queuesService.getQueue(QueueNames.FetchEvents);
	}

	async onApplicationBootstrap(): Promise<void> {
		for (let year = YEAR_OLDEST; year <= YEAR_NEWEST; year++) {
			const repeatInterval =
				year === YEAR_NEWEST
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
			await this.fetchEventsQueue.add(`fetch-events-${YEAR_NEWEST}`, {
				year: YEAR_NEWEST,
			});
		}

		this.logger.log('Cache refreshes scheduled');
	}
}
