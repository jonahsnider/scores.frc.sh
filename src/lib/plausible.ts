let initialized = false;

export async function initPlausible() {
	if (initialized) {
		return;
	}

	const { init } = await import('@plausible-analytics/tracker');

	init({
		domain: 'scores.frc.sh',
	});

	initialized = true;
}
