import { convexQuery } from '@convex-dev/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { ScoreChart } from '@/components/score-chart';
import { ScorePageLayout } from '@/components/score-page-layout';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { api } from '../../convex/_generated/api';

export const Route = createFileRoute('/$year/$eventCode')({
	component: YearEventPage,
	loader: ({ context: { queryClient }, params }) => {
		const year = Number(params.year);
		const eventCode = params.eventCode.toUpperCase();

		void queryClient.prefetchQuery(convexQuery(api.scores.eventRecords, { year, eventCode }));
	},
	head: ({ params }) => {
		const eventCode = params.eventCode.toUpperCase();
		const title = `${eventCode} ${params.year} | ${SITE_NAME}`;
		const ogTitle = `${eventCode} ${params.year} scores`;
		const description = `View the progression of the match high score at ${eventCode} ${params.year}.`;
		const canonicalUrl = `${SITE_URL}/${params.year}/${params.eventCode.toLowerCase()}`;

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
					content: ogTitle,
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
					content: ogTitle,
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

function YearEventPage() {
	const { year, eventCode } = Route.useParams();
	const yearNumber = Number(year);

	return (
		<ScorePageLayout>
			<ScoreChart year={yearNumber} eventCode={eventCode.toUpperCase()} />
		</ScorePageLayout>
	);
}
