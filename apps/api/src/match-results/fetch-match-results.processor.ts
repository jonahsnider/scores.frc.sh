import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import convert from 'convert';
import { EventsService } from '../events/events.service';
import type { FrcEvent } from '../first/interfaces/frc-events.interface';
import { QueueNames } from '../queues/enums/queue-names.enum';
import type { JobType, ReturnType } from './interfaces/fetch-match-results.queue.interface';
import { MatchResultsService } from './match-results.service';

@Processor(QueueNames.FetchMatchResults, { concurrency: 3 })
export class FetchMatchResultsProcessor extends WorkerHost {
	private static readonly REPEAT_UPCOMING_EVENT_INTERVAL = convert(6, 'hour');
	private static readonly REPEAT_FINISHED_EVENT_INTERVAL = convert(1, 'day');
	private static readonly REPEAT_IN_PROGRESS_EVENT_INTERVAL = convert(5, 'minutes');

	static getRepeatInterval(event: FrcEvent) {
		const start = new Date(event.dateStart);
		const end = new Date(event.dateEnd);
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
		const scores = await this.events.getScores({
			code: job.data.eventCode,
			weekNumber: job.data.eventWeekNumber,
			year: job.data.year,
		});

		const topScores = MatchResultsService.keepTopScores(scores);

		await this.matchResults.saveTopScores(topScores);
	}

	constructor(
		@Inject(EventsService) private readonly events: EventsService,
		@Inject(MatchResultsService) private readonly matchResults: MatchResultsService,
	) {
		super();
	}
}
