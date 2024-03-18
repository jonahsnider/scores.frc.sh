import { Module } from '@nestjs/common';
import { FirstService } from './first.service';

@Module({
	providers: [FirstService],
	exports: [FirstService],
})
export class FirstModule {}
