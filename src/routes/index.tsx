import { convexQuery } from '@convex-dev/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { ScoreChart } from '@/components/score-chart';
import { ScorePageLayout } from '@/components/score-page-layout';
import { DEFAULT_YEAR, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/constants';
import { api } from '../../convex/_generated/api';

export const Route = createFileRoute('/')({
	component: HomePage,
	loader: ({ context: { queryClient } }) =>
		void queryClient.prefetchQuery(convexQuery(api.scores.worldRecordsByYear, { year: DEFAULT_YEAR })),
	head: () => ({
		meta: [
			{
				title: SITE_NAME,
			},
			{
				name: 'description',
				content: SITE_DESCRIPTION,
			},
			// Open Graph
			{
				property: 'og:title',
				content: SITE_NAME,
			},
			{
				property: 'og:description',
				content: SITE_DESCRIPTION,
			},
			{
				property: 'og:url',
				content: SITE_URL,
			},
			// Twitter Card
			{
				name: 'twitter:title',
				content: SITE_NAME,
			},
			{
				name: 'twitter:description',
				content: SITE_DESCRIPTION,
			},
		],
		links: [
			{
				rel: 'canonical',
				href: SITE_URL,
			},
		],
	}),
});

function HomePage() {
	return (
		<ScorePageLayout>
			<ScoreChart year={DEFAULT_YEAR} />
		</ScorePageLayout>
	);
}
