'use client';

import { useState } from 'react';
import { EventInput } from './components/event-input';
import { ScoreChart } from './components/score-chart';
import { TrackQuery } from './components/track-query';
import { DEFAULT_YEAR, YearInput } from './components/year-input';

// biome-ignore lint/style/noDefaultExport: This has to be a default export
export default function HomePage() {
	const [year, setYear] = useState(DEFAULT_YEAR);
	const [eventCode, setEventCode] = useState<string | undefined>(undefined);

	return (
		<main className='flex flex-col gap-4 justify-center items-center'>
			<h1 className='text-4xl font-bold'>scores.frc.sh</h1>

			<div className='flex flex-col gap-4 justify-center items-center w-full'>
				<div className='flex gap-4'>
					<YearInput onValueChange={setYear} />

					<EventInput onValueChange={setEventCode} year={year} />
				</div>

				<ScoreChart year={year} eventCode={eventCode} />
			</div>

			<TrackQuery year={year} eventCode={eventCode} />
		</main>
	);
}
