import { OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { captureException } from '@sentry/bun';
import type { Job } from 'bullmq';

export abstract class BaseProcessor extends WorkerHost {
	protected readonly logger: Logger = new Logger(this.constructor.name);

	@OnWorkerEvent('failed')
	protected onFailed(_job: Job, error: Error) {
		this.onError(error);
	}

	@OnWorkerEvent('error')
	protected onError(error: Error) {
		// Note that this seems error events are never naturally triggered? Keeping it just in case
		this.logger.error(error);
		captureException(error);
	}
}
