import { Module } from '@nestjs/common';
import { QueuesModule } from '../queues/queues.module';
import { CacheManagerService } from './cache-manager.service';

@Module({
	imports: [QueuesModule],
	providers: [CacheManagerService],
})
export class CacheManagerModule {}
