import { Module } from '@nestjs/common';
import { TbaService } from './tba.service';

@Module({
	providers: [TbaService],
	exports: [TbaService],
})
export class TbaModule {}
