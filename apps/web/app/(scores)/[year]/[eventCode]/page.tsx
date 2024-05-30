import { ScoreChart } from '@/app/components/score-chart/score-chart';
import type { Metadata } from 'next';

export function generateMetadata(props: {
	params: { year: string; eventCode: string };
}): Metadata {
	const eventCode = props.params.eventCode.toUpperCase();

	return {
		title: `${eventCode} ${props.params.year}`,
		description: `View the progression high score at ${eventCode} ${props.params.year}.`,
		alternates: {
			canonical: `/${encodeURIComponent(props.params.year)}/${encodeURIComponent(
				props.params.eventCode.toLowerCase(),
			)}`,
		},
	};
}

// biome-ignore lint/style/noDefaultExport: This has to be a default export
export default function YearEventPage({ params }: { params: { year: string; eventCode: string } }) {
	return <ScoreChart year={Number(params.year)} eventCode={params.eventCode.toUpperCase()} />;
}
