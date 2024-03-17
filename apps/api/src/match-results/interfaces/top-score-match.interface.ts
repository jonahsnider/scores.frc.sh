import type { BaseMatch } from '../../events/interfaces/base-match.interface';

export type TopScoreMatch = BaseMatch & {
	topScore: number;
	winningTeams: number[];
};
