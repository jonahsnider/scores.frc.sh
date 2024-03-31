'use client';

import { Heading, Link, Text, Flex } from '@radix-ui/themes';
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
		<>
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
		</>
	);
}
