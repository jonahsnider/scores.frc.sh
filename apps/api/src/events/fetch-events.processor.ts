import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { EventsService } from '../events/events.service';
import { FirstService } from '../first/first.service';
import { FetchMatchResultsProcessor } from '../match-results/fetch-match-results.processor';
import type { QueueType } from '../match-results/interfaces/fetch-match-results.queue.interface';
import { QueueNames } from '../queues/enums/queue-names.enum';
import { QueuesService } from '../queues/queues.service';
import type { JobType, ReturnType } from './interfaces/fetch-events-queue.interface';

@Processor(QueueNames.FetchEvents, { concurrency: 3 })
export class FetchEventsProcessor extends WorkerHost {
	private readonly logger = new Logger(FetchEventsProcessor.name);

	override async process(job: JobType): Promise<ReturnType> {
		this.logger.debug(`Processing events for year ${job.data.year}`);
		const events = await this.firstService.listEvents(job.data.year);

		this.logger.verbose(`Fetched ${events.Events.length} events for year ${job.data.year}`);

		// Schedule processing for events
		await Promise.all(
			events.Events.map((event) =>
				this.fetchMatchResultsQueue.add(
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
				),
			),
		);

		this.logger.debug(`Scheduled processing for events for year ${job.data.year}`);

		this.logger.verbose(`Purging orphaned events for year ${job.data.year}`);
		const purgedEvents = await this.events.purgeOrphanedEvents(job.data.year);
		this.logger.verbose(`Purged orphaned events for year ${job.data.year}: ${JSON.stringify(purgedEvents)}`);
	}

	private readonly fetchMatchResultsQueue: QueueType;

	constructor(
		@Inject(EventsService) private readonly events: EventsService,
		@Inject(FirstService) private readonly firstService: FirstService,
		@Inject(QueuesService) queuesService: QueuesService,
	) {
		super();

		this.fetchMatchResultsQueue = queuesService.getQueue(QueueNames.FetchMatchResults);
	}
}
