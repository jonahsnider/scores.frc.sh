import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { QueueNames } from '../queues/enums/queue-names.enum';
import { QueuesService } from '../queues/queues.service';
import { FetchMatchResultsProcessor } from './fetch-match-results.processor';
import { MatchResultsService } from './match-results.service';

@Module({
	imports: [EventsModule, QueuesService.registerQueue(QueueNames.FetchMatchResults)],
	providers: [MatchResultsService, FetchMatchResultsProcessor],
	exports: [MatchResultsService],
})
export class MatchResultsModule {}
