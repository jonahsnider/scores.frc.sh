import type { BaseMatch } from './base-match.interface';

export type Match = BaseMatch & {
	scores: {
		blue: number;
		red: number;
	};
	teams: {
		blue: number[];
		red: number[];
	};
};
