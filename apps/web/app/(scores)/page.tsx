import type { Metadata } from 'next';
import { ScoreChart } from '../components/score-chart/score-chart';
import { DEFAULT_YEAR } from '../constants';

export const metadata: Metadata = {
	alternates: {
		canonical: '/',
	},
};

// biome-ignore lint/style/noDefaultExport: This has to be a default export
export default function HomePage() {
	return <ScoreChart year={DEFAULT_YEAR} />;
}
