import { init } from '@plausible-analytics/tracker';

let initialized = false;

export function initPlausible() {
	if (initialized) {
		return;
	}

	init({
		domain: 'scores.frc.sh',
	});

	initialized = true;
}
