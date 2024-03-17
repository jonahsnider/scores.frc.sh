import { BaseWorker } from '../queues/base.worker';

import convert from 'convert';
import type { EventsService } from '../events/events.service';
import type { FrcEvent } from '../first/interfaces/frc-events.interface';
import { fetchMatchResultsQueue } from '../queues/queues';
import type { DataType, JobType, NameType, ReturnType } from './interfaces/fetch-match-results.queue.interface';
import { MatchResultsService } from './match-results.service';

export class FetchMatchResultsWorker extends BaseWorker<DataType, ReturnType, NameType> {
	private static readonly REPEAT_UPCOMING_EVENT_INTERVAL = convert(6, 'hour');
	private static readonly REPEAT_FINISHED_EVENT_INTERVAL = convert(1, 'day');
	private static readonly REPEAT_IN_PROGRESS_EVENT_INTERVAL = convert(5, 'minutes');

	static getRepeatInterval(event: FrcEvent) {
		const start = new Date(event.dateStart);
		const end = new Date(event.dateEnd);
		const now = new Date();

		if (now < start) {
			return FetchMatchResultsWorker.REPEAT_UPCOMING_EVENT_INTERVAL;
		}

		if (now > end) {
			return FetchMatchResultsWorker.REPEAT_FINISHED_EVENT_INTERVAL;
		}

		return FetchMatchResultsWorker.REPEAT_IN_PROGRESS_EVENT_INTERVAL;
	}

	protected override async process(job: JobType): Promise<ReturnType> {
		const scores = await this.events.getScores({
			code: job.data.eventCode,
			weekNumber: job.data.eventWeekNumber,
			year: job.data.year,
		});

		const topScores = MatchResultsService.keepTopScores(scores);

		await this.matchResults.saveTopScores(topScores);
	}

	constructor(
		private readonly events: EventsService,
		private readonly matchResults: MatchResultsService,
	) {
		super(fetchMatchResultsQueue, {
			concurrency: 3,
		});
	}
}
