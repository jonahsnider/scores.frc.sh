'use client';

import { mapFill } from '@jonahsnider/util';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { H1 } from './components/headings/h1';
import { H3 } from './components/headings/h3';
import { ScoreChart } from './components/score-chart';

const MIN_YEAR = 2016;
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
			<H1>scores.frc.sh</H1>

			<div className='pb-4'>
				{!eventCode && <H3>Global high scores for {year}</H3>}
				{eventCode && (
					<H3>
						High scores for {eventCode} {year}
					</H3>
				)}
			</div>

			<div className='flex flex-col gap-4 justify-center items-center w-full'>
				<div className='flex gap-4'>
					<select
						className='p-2 bg-neutral-800 rounded shadow outline-none'
						value={year}
						onChange={(e) => setYear(e.target.value)}
					>
						{mapFill((index) => MIN_YEAR + index, MAX_YEAR - MIN_YEAR + 1).map((year) => (
							<option key={year}>{year}</option>
						))}
					</select>
					<input
						className='p-2 bg-neutral-800 rounded shadow outline-none'
						type='text'
						value={eventCode ?? ''}
						placeholder='Event code (optional)'
						onChange={(e) => setEventCode(e.target.value)}
					/>
				</div>

				<ScoreChart year={year} eventCode={eventCode} />
			</div>
		</main>
	);
}
