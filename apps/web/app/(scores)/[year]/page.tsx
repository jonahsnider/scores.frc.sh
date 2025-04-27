import { ScoreChart } from '@/app/components/score-chart/score-chart';
import { DEFAULT_YEAR } from '@/app/constants';
import type { Metadata, ResolvingMetadata } from 'next';
import { RedirectType, redirect } from 'next/navigation';

export async function generateMetadata(
	props: {
		params: { year: string };
	},
	resolvingParent: ResolvingMetadata,
): Promise<Metadata> {
	const parent = await resolvingParent;

	return {
		title: `${props.params.year}`,
		description: `View the progression of the world record & event high scores for FRC in ${props.params.year}.`,
		alternates: {
			canonical: `/${encodeURIComponent(props.params.year)}`,
		},
		// @ts-expect-error Evil Next types
		openGraph: {
			...(parent.openGraph ?? {}),
			title: `${props.params.year} scores`,
		},
	};
}

export default function YearPage({ params }: { params: { year: string } }) {
	const year = Number(params.year);

	if (year === DEFAULT_YEAR) {
		redirect('/', RedirectType.replace);
	}

	return <ScoreChart year={year} />;
}
