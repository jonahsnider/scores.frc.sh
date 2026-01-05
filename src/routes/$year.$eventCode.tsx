import { createFileRoute } from '@tanstack/react-router';
import { ScoreChart } from '@/components/score-chart';

export const Route = createFileRoute('/$year/$eventCode')({
	component: YearEventPage,
	head: ({ params }) => {
		const eventCode = params.eventCode.toUpperCase();
		return {
			meta: [
				{
					title: `${eventCode} ${params.year} | scores.frc.sh`,
				},
				{
					name: 'description',
					content: `View the progression of the match high score at ${eventCode} ${params.year}.`,
				},
			],
		};
	},
});

function YearEventPage() {
	const { year, eventCode } = Route.useParams();
	const yearNumber = Number(year);

	return <ScoreChart year={yearNumber} eventCode={eventCode.toUpperCase()} />;
}
