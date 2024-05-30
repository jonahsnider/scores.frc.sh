import { ScoreChart } from '@/app/components/score-chart/score-chart';
import type { Metadata, ResolvingMetadata } from 'next';

export async function generateMetadata(
	props: {
		params: { year: string; eventCode: string };
	},
	resolvingParent: ResolvingMetadata,
): Promise<Metadata> {
	const eventCode = props.params.eventCode.toUpperCase();

	const parent = await resolvingParent;

	return {
		title: `${eventCode} ${props.params.year}`,
		description: `View the progression of the match high score at ${eventCode} ${props.params.year}.`,
		alternates: {
			canonical: `/${encodeURIComponent(props.params.year)}/${encodeURIComponent(
				props.params.eventCode.toLowerCase(),
			)}`,
		},
		// @ts-expect-error Evil Next types
		openGraph: {
			...(parent.openGraph ?? {}),
			title: `${eventCode} ${props.params.year} scores`,
		},
	};
}

// biome-ignore lint/style/noDefaultExport: This has to be a default export
export default function YearEventPage({ params }: { params: { year: string; eventCode: string } }) {
	return <ScoreChart year={Number(params.year)} eventCode={params.eventCode.toUpperCase()} />;
}
