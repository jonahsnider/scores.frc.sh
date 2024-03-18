import { Inject, Injectable } from '@nestjs/common';
import { HighScoresRouter } from '../high-scores/high-scores.router';
import { router } from './trpc';

@Injectable()
export class AppRouter {
	constructor(@Inject(HighScoresRouter) private readonly highScoresRouter: HighScoresRouter) {}

	createRouter() {
		return router({
			highScores: this.highScoresRouter.createRouter(),
		});
	}
}
