import type { Metadata } from 'next';
import { EventInput } from './components/event-input';
import { ScoreChart } from './components/score-chart/score-chart';
import { TrackQuery } from './components/track-query';
import { YearInput } from './components/year-input';
import { QueryProvider } from './contexts/query/query-context';
import { metadataBase } from './metadata';
import { Suspense } from 'react';

export const metadata: Metadata = {
	metadataBase,
	alternates: {
		canonical: '/',
	},
};

// biome-ignore lint/style/noDefaultExport: This has to be a default export
export default function HomePage() {
	return (
		<Suspense>
			<QueryProvider>
				<div className='flex flex-col gap-4 justify-center items-center w-full pt-2'>
					<div className='flex gap-4'>
						<YearInput />

						<EventInput />
					</div>

					<ScoreChart />
				</div>

				<TrackQuery />
			</QueryProvider>
		</Suspense>
	);
}
