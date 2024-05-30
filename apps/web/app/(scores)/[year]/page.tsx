import { ScoreChart } from '@/app/components/score-chart/score-chart';
import { DEFAULT_YEAR } from '@/app/constants';
import type { Metadata } from 'next';
import { RedirectType, redirect } from 'next/navigation';

export function generateMetadata(props: {
	params: { year: string };
}): Metadata {
	return {
		title: `${props.params.year}`,
		description: `View the progression of the world record & event high scores for FRC in ${props.params.year}.`,
		alternates: {
			canonical: `/${encodeURIComponent(props.params.year)}`,
		},
		openGraph: {
			title: `${props.params.year} scores`,
		},
	};
}

// biome-ignore lint/style/noDefaultExport: This has to be a default export
export default function YearPage({ params }: { params: { year: string } }) {
	const year = Number(params.year);

	if (year === DEFAULT_YEAR) {
		redirect('/', RedirectType.replace);
	}

	return <ScoreChart year={year} />;
}
