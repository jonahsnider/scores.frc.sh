import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { AuthMiddleware } from '../auth/auth.middleware';
import { AuthModule } from '../auth/auth.module';
import { BullBoardMiddleware } from './bull-board.middleware';
import { QueuesService } from './queues.service';

@Module({
	imports: [AuthModule],
	providers: [QueuesService, BullBoardMiddleware],
	exports: [QueuesService],
})
export class QueuesModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(AuthMiddleware, BullBoardMiddleware).forRoutes('/internal/queues');
	}
}
