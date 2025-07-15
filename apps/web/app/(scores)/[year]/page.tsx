import type { Metadata, ResolvingMetadata } from 'next';
import { RedirectType, redirect } from 'next/navigation';
import { ScoreChart } from '@/app/components/score-chart/score-chart';
import { DEFAULT_YEAR } from '@/app/constants';

export async function generateMetadata(
	props: {
		params: Promise<{ year: string }>;
	},
	resolvingParent: ResolvingMetadata,
): Promise<Metadata> {
	const parent = await resolvingParent;

	const params = await props.params;

	return {
		title: `${params.year}`,
		description: `View the progression of the world record & event high scores for FRC in ${params.year}.`,
		alternates: {
			canonical: `/${encodeURIComponent(params.year)}`,
		},
		// @ts-expect-error Evil Next types
		openGraph: {
			...(parent.openGraph ?? {}),
			title: `${params.year} scores`,
		},
	};
}

export default async function YearPage(props: { params: Promise<{ year: string }> }) {
	const params = await props.params;
	const year = Number(params.year);

	if (year === DEFAULT_YEAR) {
		redirect('/', RedirectType.replace);
	}

	return <ScoreChart year={year} />;
}
