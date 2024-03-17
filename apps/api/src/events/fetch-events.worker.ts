import { firstService } from '../first/first.service';
import { FetchMatchResultsWorker } from '../match-results/fetch-match-results.worker';
import { BaseWorker } from '../queues/base.worker';
import { fetchEventsQueue, fetchMatchResultsQueue } from '../queues/queues';
import type { EventsService } from './events.service';
import type { DataType, JobType, NameType, ReturnType } from './interfaces/fetch-events-queue.interface';

export class FetchEventsWorker extends BaseWorker<DataType, ReturnType, NameType> {
	protected override async process(job: JobType): Promise<ReturnType> {
		const events = await firstService.listEvents(job.data.year);

		// Schedule processing for events
		for (const event of events.Events) {
			await fetchMatchResultsQueue.add(
				`fetch-match-results-${job.data.year}-${event.code}`,
				{
					year: job.data.year,
					eventCode: event.code,
					eventWeekNumber: event.weekNumber,
				},
				{
					repeat: {
						every: FetchMatchResultsWorker.getRepeatInterval(event).to('ms'),
						// Prevent jobs for orphaned events from piling up
						limit: 5,
					},
				},
			);
		}

		await this.events.purgeOrphanedEvents(job.data.year);
	}

	constructor(private readonly events: EventsService) {
		super(fetchEventsQueue, {
			concurrency: 3,
		});
	}
}
