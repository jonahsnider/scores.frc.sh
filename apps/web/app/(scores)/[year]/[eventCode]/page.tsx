import { ScoreChart } from '@/app/components/score-chart/score-chart';
import type { Metadata, ResolvingMetadata } from 'next';

export async function generateMetadata(
	props: {
		params: Promise<{ year: string; eventCode: string }>;
	},
	resolvingParent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params;
	const eventCode = params.eventCode.toUpperCase();

	const parent = await resolvingParent;

	return {
		title: `${eventCode} ${params.year}`,
		description: `View the progression of the match high score at ${eventCode} ${params.year}.`,
		alternates: {
			canonical: `/${encodeURIComponent(params.year)}/${encodeURIComponent(params.eventCode.toLowerCase())}`,
		},
		// @ts-expect-error Evil Next types
		openGraph: {
			...(parent.openGraph ?? {}),
			title: `${eventCode} ${params.year} scores`,
		},
	};
}

export default async function YearEventPage(props: { params: Promise<{ year: string; eventCode: string }> }) {
	const params = await props.params;
	return <ScoreChart year={Number(params.year)} eventCode={params.eventCode.toUpperCase()} />;
}
