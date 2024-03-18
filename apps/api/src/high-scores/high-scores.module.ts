import { Module } from '@nestjs/common';
import { HighScoresRouter } from './high-scores.router';
import { HighScoresService } from './high-scores.service';

@Module({
	providers: [HighScoresService, HighScoresRouter],
	exports: [HighScoresRouter],
})
export class HighScoresModule {}
