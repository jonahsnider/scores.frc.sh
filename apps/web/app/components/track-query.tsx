import { useDebounce } from '@uidotdev/usehooks';
import { track } from '@vercel/analytics';
import { useEffect } from 'react';
import { usePlausible } from '../hooks/plausible';

type Props = {
	year: number;
	eventCode: string | undefined;
};

export function TrackQuery({ eventCode, year }: Props) {
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
