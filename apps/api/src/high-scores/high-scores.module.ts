import { Module } from '@nestjs/common';
import { HighScoresRouter } from './high-scores.router';
import { HighScoresService } from './high-scores.service';
import { EventsModule } from '../events/events.module';

@Module({
	imports: [EventsModule],
	providers: [HighScoresService, HighScoresRouter],
	exports: [HighScoresRouter],
})
export class HighScoresModule {}
