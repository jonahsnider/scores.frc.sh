/** Matches that set a new high score, ordered by when they occurred. */
export function filterMatchesToRecordBreaking<T extends { result: { score: number; timestamp: number } }>(
	matches: T[],
): T[] {
	let currentRecord = -1;
	return [...matches]
		.sort((a, b) => a.result.timestamp - b.result.timestamp)
		.filter((match) => {
			if (match.result.score > currentRecord) {
				currentRecord = match.result.score;
				return true;
			}
			return false;
		});
}
