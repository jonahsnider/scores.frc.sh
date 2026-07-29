'use client';

import { formatDistance } from 'date-fns';
import { useEffect, useState } from 'react';

type Props = {
	label: string;
	timestamp: number;
};

export function LastFetchedTime({ label, timestamp }: Props) {
	const [now, setNow] = useState<number | undefined>(undefined);

	useEffect(() => {
		setNow(Date.now());

		const interval = setInterval(() => {
			setNow(Date.now());
		}, 60_000);

		return () => clearInterval(interval);
	}, []);

	if (now === undefined) {
		return undefined;
	}

	const fetchedAt = new Date(timestamp);

	return (
		<time
			dateTime={fetchedAt.toISOString()}
			title={fetchedAt.toLocaleString()}
			aria-label={`${label} ${fetchedAt.toLocaleString()}`}
			className="text-xs text-muted-foreground"
		>
			{label} {formatDistance(fetchedAt, now, { addSuffix: true })}
		</time>
	);
}
