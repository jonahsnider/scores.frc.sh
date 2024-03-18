import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { HighScoresRouter } from './high-scores.router';
import { HighScoresService } from './high-scores.service';

@Module({
	imports: [EventsModule],
	providers: [HighScoresService, HighScoresRouter],
	exports: [HighScoresRouter],
})
export class HighScoresModule {}
