'use client';

import { useDebounce } from '@uidotdev/usehooks';
import { track } from '@vercel/analytics';
import { useContext, useEffect } from 'react';
import { QueryContext } from '../contexts/query/query-context';
import { usePlausible } from '../hooks/plausible';

export function TrackQuery() {
	const { year, eventCode } = useContext(QueryContext);

	const plausible = usePlausible();

	const debouncedYear = useDebounce(year, 750);
	const debouncedEventCode = useDebounce(eventCode, 750);

	useEffect(() => {
		if (debouncedEventCode) {
			plausible('View event stats', { props: { year: debouncedYear, eventCode: debouncedEventCode } });
			track('View event stats', { year: debouncedYear, eventCode: debouncedEventCode });
		} else {
			plausible('View global stats', { props: { year: debouncedYear } });
			track('View global stats', { year: debouncedYear });
		}
	}, [debouncedYear, debouncedEventCode, plausible]);

	return <></>;
}
