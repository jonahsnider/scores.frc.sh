import { createFileRoute, Outlet, redirect, useMatch } from '@tanstack/react-router';
import { EventInput } from '@/components/event-input';
import { ScoreChart } from '@/components/score-chart';
import { YearSelect } from '@/components/year-select';
import { DEFAULT_YEAR, SITE_NAME, SITE_URL } from '@/lib/constants';

export const Route = createFileRoute('/$year')({
	component: YearLayout,
	beforeLoad: ({ params }) => {
		const year = Number(params.year);
		if (year === DEFAULT_YEAR) {
			throw redirect({ to: '/', replace: true });
		}
	},
	head: ({ params }) => {
		const title = `${params.year} | ${SITE_NAME}`;
		const description = `View the progression of the world record & event high scores for FRC in ${params.year}.`;
		const canonicalUrl = `${SITE_URL}/${params.year}`;

		return {
			meta: [
				{
					title,
				},
				{
					name: 'description',
					content: description,
				},
				// Open Graph
				{
					property: 'og:title',
					content: `${params.year} scores`,
				},
				{
					property: 'og:description',
					content: description,
				},
				{
					property: 'og:url',
					content: canonicalUrl,
				},
				// Twitter Card
				{
					name: 'twitter:title',
					content: `${params.year} scores`,
				},
				{
					name: 'twitter:description',
					content: description,
				},
			],
			links: [
				{
					rel: 'canonical',
					href: canonicalUrl,
				},
			],
		};
	},
});

function YearLayout() {
	const { year } = Route.useParams();
	const yearNumber = Number(year);

	// Check if there's a child route (eventCode)
	const childMatch = useMatch({
		from: '/$year/$eventCode',
		shouldThrow: false,
	});
	const hasEventCode = childMatch !== undefined;

	return (
		<div className="flex flex-col gap-4 justify-center items-center w-full pt-2">
			<div className="flex gap-4">
				<YearSelect />
				<EventInput />
			</div>

			{hasEventCode ? <Outlet /> : <ScoreChart year={yearNumber} />}
		</div>
	);
}
