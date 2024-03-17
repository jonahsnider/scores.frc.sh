import convert from 'convert';
import { configService } from '../config/config.service';
import { baseLogger } from '../logger/logger';
import { fetchEventsQueue } from '../queues/queues';

export class CacheManager {
	static readonly YEAR_OLDEST = 2016;
	static readonly YEAR_NEWEST = new Date().getFullYear();

	private static readonly FORCE_REFRESH_IN_DEV = true;

	private static readonly CACHE_REFRESH_INTERVAL_CURRENT_YEAR = convert(1, 'hour');
	private static readonly CACHE_REFRESH_INTERVAL_PAST_YEAR = convert(1, 'week');

	private readonly logger = baseLogger.child({ module: 'cache manager' });

	async init(): Promise<void> {
		for (let year = CacheManager.YEAR_OLDEST; year <= CacheManager.YEAR_NEWEST; year++) {
			const repeatInterval =
				year === CacheManager.YEAR_NEWEST
					? CacheManager.CACHE_REFRESH_INTERVAL_CURRENT_YEAR
					: CacheManager.CACHE_REFRESH_INTERVAL_PAST_YEAR;

			await fetchEventsQueue.add(
				`fetch-events-${year}`,
				{ year },
				{
					repeat: {
						every: repeatInterval.to('ms'),
					},
				},
			);
		}

		if (CacheManager.FORCE_REFRESH_IN_DEV && configService.nodeEnv === 'development') {
			this.logger.info('Scheduling cache refresh right now');
			await fetchEventsQueue.add(`fetch-events-${CacheManager.YEAR_NEWEST}`, { year: CacheManager.YEAR_NEWEST });
		}

		this.logger.info('Cache refreshes scheduled');
	}
}

export const cacheManager = new CacheManager();
