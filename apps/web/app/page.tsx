'use client';

import { mapFill } from '@jonahsnider/util';
import { Select, SelectItem, TextInput } from '@tremor/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ScoreChart } from './components/score-chart';
import { usePlausible } from './hooks/plausible';
import { useDebounce } from '@uidotdev/usehooks';
import { track } from '@vercel/analytics';

const MIN_YEAR = 2023;
const MAX_YEAR = new Date().getFullYear();

const DEFAULT_YEAR = MAX_YEAR;

// biome-ignore lint/style/noDefaultExport: This has to be a default export
export default function HomePage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [year, setYearRaw] = useState(Number(searchParams.get('year') ?? DEFAULT_YEAR));
	const [eventCode, setEventCodeRaw] = useState<string | undefined>(searchParams.get('eventCode') ?? undefined);

	const setYear = (value: string) => setYearRaw(Number(value));
	const setEventCode = (value: string) => setEventCodeRaw(value === '' ? undefined : value.toUpperCase());

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

	useEffect(() => {
		const url = new URL(window.location.href);

		if (year === DEFAULT_YEAR) {
			url.searchParams.delete('year');
		} else {
			url.searchParams.set('year', year.toString());
		}

		if (eventCode) {
			url.searchParams.set('eventCode', eventCode);
		} else {
			url.searchParams.delete('eventCode');
		}

		router.replace(url.href);
	}, [year, eventCode, router]);

	return (
		<main className='flex flex-col gap-4 justify-center items-center'>
			<h1 className='text-4xl font-bold'>scores.frc.sh</h1>

			<div className='flex flex-col gap-4 justify-center items-center w-full'>
				<div className='flex gap-4'>
					<Select value={year.toString()} onValueChange={(value) => setYear(value)}>
						{mapFill((index) => MIN_YEAR + index, MAX_YEAR - MIN_YEAR + 1).map((year) => (
							<SelectItem key={year} value={year.toString()}>
								{year}
							</SelectItem>
						))}
					</Select>

					<TextInput
						type='text'
						placeholder='Event code (optional)'
						value={eventCode ?? ''}
						onValueChange={(value) => setEventCode(value)}
					/>
				</div>

				<ScoreChart year={year} eventCode={eventCode} />
			</div>
		</main>
	);
}
