import { Module } from '@nestjs/common';
import { HighScoresModule } from '../high-scores/high-scores.module';
import { AppRouter } from './app.router';
import { TrpcService } from './trpc.service';

@Module({
	imports: [HighScoresModule],
	providers: [TrpcService, AppRouter],
})
export class TrpcModule {}
