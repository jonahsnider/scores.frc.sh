'use client';

import { Suspense, useState } from 'react';
import { EventInput } from './components/event-input';
import { ScoreChart } from './components/score-chart/score-chart';
import { TrackQuery } from './components/track-query';
import { DEFAULT_YEAR, YearInput } from './components/year-input';

// biome-ignore lint/style/noDefaultExport: This has to be a default export
export default function HomePage() {
	const [year, setYear] = useState(DEFAULT_YEAR);
	const [eventCode, setEventCode] = useState<string | undefined>(undefined);

	return (
		<main className='flex flex-col gap-2 justify-center items-center'>
			<h1 className='text-4xl font-bold'>scores.frc.sh</h1>

			<h2 className='text-tremor-title'>
				Created by{' '}
				<a className='underline' href='https://jonahsnider.com'>
					Jonah Snider
				</a>
			</h2>

			<p className='text-tremor-title'>
				View source on{' '}
				<a className='underline' href='https://github.com/jonahsnider/scores.frc.sh'>
					GitHub
				</a>
			</p>

			<div className='flex flex-col gap-4 justify-center items-center w-full pt-2'>
				<div className='flex gap-4'>
					<Suspense>
						<YearInput onValueChange={setYear} />
					</Suspense>

					<Suspense>
						<EventInput onValueChange={setEventCode} year={year} />
					</Suspense>
				</div>

				<ScoreChart year={year} eventCode={eventCode} />
			</div>

			<TrackQuery year={year} eventCode={eventCode} />
		</main>
	);
}
