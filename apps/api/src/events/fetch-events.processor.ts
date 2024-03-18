import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { EventsService } from '../events/events.service';
import { FirstService } from '../first/first.service';
import { FetchMatchResultsProcessor } from '../match-results/fetch-match-results.processor';
import type { QueueType } from '../match-results/interfaces/fetch-match-results.queue.interface';
import { QueueNames } from '../queues/enums/queue-names.enum';
import type { JobType, ReturnType } from './interfaces/fetch-events-queue.interface';

@Processor(QueueNames.FetchEvents, { concurrency: 3 })
export class FetchEventsProcessor extends WorkerHost {
	override async process(job: JobType): Promise<ReturnType> {
		const events = await this.firstService.listEvents(job.data.year);

		// Schedule processing for events
		for (const event of events.Events) {
			await this.fetchMatchResultsQueue.add(
				`fetch-match-results-${job.data.year}-${event.code}`,
				{
					year: job.data.year,
					eventCode: event.code,
					eventWeekNumber: event.weekNumber,
				},
				{
					repeat: {
						every: FetchMatchResultsProcessor.getRepeatInterval(event).to('ms'),
						// Prevent jobs for orphaned events from piling up
						limit: 5,
					},
				},
			);
		}

		await this.events.purgeOrphanedEvents(job.data.year);
	}

	constructor(
		@Inject(EventsService) private readonly events: EventsService,
		@Inject(FirstService) private readonly firstService: FirstService,
		@InjectQueue(QueueNames.FetchMatchResults) private readonly fetchMatchResultsQueue: QueueType,
	) {
		super();
	}
}
