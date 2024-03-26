import { Processor } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import convert from 'convert';
import { EventsService } from '../events/events.service';
import { BaseProcessor } from '../queues/base.processor';
import { QueueNames } from '../queues/enums/queue-names.enum';
import type { TbaEvent } from '../tba/interfaces/tba-event.interface';
import type { JobType, ReturnType } from './interfaces/fetch-match-results.queue.interface';
import { MatchResultsService } from './match-results.service';

@Processor(QueueNames.FetchMatchResults, { concurrency: 3 })
export class FetchMatchResultsProcessor extends BaseProcessor {
	private static readonly REPEAT_UPCOMING_EVENT_INTERVAL = convert(6, 'hour');
	private static readonly REPEAT_FINISHED_EVENT_INTERVAL = convert(1, 'day');
	private static readonly REPEAT_IN_PROGRESS_EVENT_INTERVAL = convert(5, 'minutes');

	static getRepeatInterval(event: TbaEvent) {
		const start = new Date(event.start_date);
		const end = new Date(event.end_date);
		const now = new Date();

		if (now < start) {
			return FetchMatchResultsProcessor.REPEAT_UPCOMING_EVENT_INTERVAL;
		}

		if (now > end) {
			return FetchMatchResultsProcessor.REPEAT_FINISHED_EVENT_INTERVAL;
		}

		return FetchMatchResultsProcessor.REPEAT_IN_PROGRESS_EVENT_INTERVAL;
	}

	override async process(job: JobType): Promise<ReturnType> {
		const eventName = `${job.data.year} ${job.data.eventCode}`;
		this.logger.debug(`Processing match results for ${eventName}`);

		this.logger.verbose(`Fetching scores for ${eventName}`);
		const matches = await this.events.getMatches(job.data.eventCode, job.data.year);
		this.logger.verbose(`Fetched ${matches.length} matches for ${eventName}`);

		const topScores = MatchResultsService.keepTopScores(matches);

		this.logger.verbose(`Saving top scores for ${eventName}`);
		await this.matchResults.saveTopScores(topScores);
		this.logger.verbose(`Saved top scores for ${eventName}`);
	}

	constructor(
		@Inject(EventsService) private readonly events: EventsService,
		@Inject(MatchResultsService) private readonly matchResults: MatchResultsService,
	) {
		super();
	}
}
