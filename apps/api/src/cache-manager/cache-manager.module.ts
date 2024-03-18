import { Module } from '@nestjs/common';
import { CacheManagerService } from './cache-manager.service';
import { QueuesModule } from '../queues/queues.module';

@Module({
	imports: [QueuesModule],
	providers: [CacheManagerService],
})
export class CacheManagerModule {}
