import { createFileRoute } from '@tanstack/react-router';
import { EventInput } from '@/components/event-input';
import { ScoreChart } from '@/components/score-chart';
import { YearSelect } from '@/components/year-select';
import { DEFAULT_YEAR } from '@/lib/constants';

export const Route = createFileRoute('/')({
	component: HomePage,
	head: () => ({
		meta: [
			{
				title: 'scores.frc.sh',
			},
			{
				name: 'description',
				content: 'View the progression of the world record & event high scores for FRC.',
			},
		],
	}),
});

function HomePage() {
	return (
		<div className="flex flex-col gap-4 justify-center items-center w-full pt-2">
			<div className="flex gap-4">
				<YearSelect />
				<EventInput />
			</div>

			<ScoreChart year={DEFAULT_YEAR} />
		</div>
	);
}
