import { Module } from '@nestjs/common';
import { FirstModule } from '../first/first.module';
import { QueueNames } from '../queues/enums/queue-names.enum';
import { QueuesModule } from '../queues/queues.module';
import { QueuesService } from '../queues/queues.service';
import { TbaModule } from '../tba/tba.module';
import { EventsService } from './events.service';
import { FetchEventsProcessor } from './fetch-events.processor';

@Module({
	imports: [FirstModule, TbaModule, QueuesModule, QueuesService.registerQueue(QueueNames.FetchEvents)],
	providers: [EventsService, FetchEventsProcessor],
	exports: [EventsService],
})
export class EventsModule {}
