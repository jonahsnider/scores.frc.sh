import { convexQuery } from '@convex-dev/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { ScoreChart } from '@/components/score-chart';
import { ScorePageLayout } from '@/components/score-page-layout';
import { DEFAULT_YEAR, SITE_NAME, SITE_URL } from '@/lib/constants';
import { api } from '../../convex/_generated/api';

export const Route = createFileRoute('/$year_')({
	component: YearPage,
	beforeLoad: ({ params }) => {
		const year = Number(params.year);
		if (year === DEFAULT_YEAR) {
			throw redirect({ to: '/', replace: true });
		}
	},
	loader: ({ context: { queryClient }, params }) => {
		const year = Number(params.year);

		void queryClient.prefetchQuery(convexQuery(api.scores.worldRecordsByYear, { year }));
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

function YearPage() {
	const { year } = Route.useParams();
	const yearNumber = Number(year);

	return (
		<ScorePageLayout>
			<ScoreChart year={yearNumber} />
		</ScorePageLayout>
	);
}
