'use client';

import { useState } from 'react';
import { ScoreChart } from './components/score-chart';
import { H1 } from './components/headings/h1';
import { mapFill } from '@jonahsnider/util';
import { H2 } from './components/headings/h2';
import { H3 } from './components/headings/h3';

const MIN_YEAR = 2016;
const MAX_YEAR = new Date().getFullYear();

// biome-ignore lint/style/noDefaultExport: This has to be a default export
export default function HomePage() {
	const [year, setYearRaw] = useState(MAX_YEAR);
	const [eventCode, setEventCodeRaw] = useState<string | undefined>();

	const setYear = (value: string) => setYearRaw(Number(value));
	const setEventCode = (value: string) => setEventCodeRaw(value === '' ? undefined : value.toUpperCase());

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
