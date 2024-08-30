import { Processor } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { EventsService } from '../events/events.service';
import { FetchMatchResultsProcessor } from '../match-results/fetch-match-results.processor';
import type { NameType, QueueType } from '../match-results/interfaces/fetch-match-results.queue.interface';
import { BaseProcessor } from '../queues/base.processor';
import { QueueNames } from '../queues/enums/queue-names.enum';
import { QueuesService } from '../queues/queues.service';
import type { JobType, ReturnType } from './interfaces/fetch-events-queue.interface';

@Processor(QueueNames.FetchEvents, { concurrency: 3 })
export class FetchEventsProcessor extends BaseProcessor {
	override async process(job: JobType): Promise<ReturnType> {
		this.logger.debug(`Processing events for year ${job.data.year}`);

		const events = await this.events.listEvents(job.data.year);
		this.logger.verbose(`Fetched ${events.length} events for year ${job.data.year}`);

		// BullMQ treats repeatable jobs as a unique, separate job, made unique by their repeat key
		// By default, the repeat key is defined with their repeat options (including interval)
		// So if you create a repeating job with a very short interval (ex. in progress event), and then try updating the repeat interval later, it will create a new job
		// Additionally, it won't get rid of the old repeating job, which can cause orphaned/runaway jobs in the queue

		// We solve this by making repeat IDs unique by the job name, ensuring that there is only one repeat per job
		// If we try adding a repeating job to the queue, it will be ignored if a job with the same repeat key already exists
		// So, we must explicitly delete the old repeating job before adding the new one
		// This ensures that jobs always have the correct repeat options

		// We can't get repeating jobs by job name, so we need to get *all* repeating jobs for the entire queue, and search through them ourselves
		// Honestly a huge limitation in BullMQ, to the point where dealing with this behavior has convinced me I never want to use BullMQ again
		// I would have rewritten this entire app to use Kafka or RabbitMQ but didn't want to spend the time to do it
		const repeatedJobs = await this.fetchMatchResultsQueue.getRepeatableJobs();

		const jobNameToRepeatedKeys: Map<string, string[]> = new Map();

		for (const job of repeatedJobs) {
			const jobName = job.name;

			if (!jobNameToRepeatedKeys.has(jobName)) {
				jobNameToRepeatedKeys.set(jobName, []);
			}

			// biome-ignore lint/style/noNonNullAssertion: This is safe
			jobNameToRepeatedKeys.get(jobName)!.push(job.key);
		}

		// Schedule processing for events
		await Promise.all(
			events.map(async (event) => {
				const jobName: NameType = `fetch-match-results-${job.data.year}-${event.event_code}`;

				// Remove all the repeated jobs (usually this will be the current/accurrate repeat, and maybe an out of date repeat)
				const repeatedKeys = jobNameToRepeatedKeys.get(jobName);
				if (repeatedKeys) {
					await Promise.all(repeatedKeys.map((key) => this.fetchMatchResultsQueue.removeRepeatableByKey(key)));
				}

				return this.fetchMatchResultsQueue.add(
					jobName,
					{
						year: job.data.year,
						eventCode: event.event_code,
					},
					{
						repeat: {
							every: FetchMatchResultsProcessor.getRepeatInterval(event).to('ms'),
						},
					},
				);
			}),
		);

		this.logger.debug(`Scheduled processing for events for year ${job.data.year}`);

		this.logger.verbose(`Purging orphaned events for year ${job.data.year}`);
		const purgedEvents = await this.events.purgeOrphanedEvents(job.data.year);
		this.logger.verbose(`Purged orphaned events for year ${job.data.year}: ${JSON.stringify(purgedEvents)}`);
	}

	private readonly fetchMatchResultsQueue: QueueType;

	constructor(
		@Inject(EventsService) private readonly events: EventsService,
		@Inject(QueuesService) queuesService: QueuesService,
	) {
		super();

		this.fetchMatchResultsQueue = queuesService.getQueue(QueueNames.FetchMatchResults);
	}
}
