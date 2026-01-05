import { createFileRoute } from '@tanstack/react-router';
import { EventInput } from '@/components/event-input';
import { ScoreChart } from '@/components/score-chart';
import { YearSelect } from '@/components/year-select';
import { DEFAULT_YEAR, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/constants';

export const Route = createFileRoute('/')({
	component: HomePage,
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
		<div className="flex flex-col gap-4 justify-center items-center w-full pt-2">
			<div className="flex gap-4">
				<YearSelect />
				<EventInput />
			</div>

			<ScoreChart year={DEFAULT_YEAR} />
		</div>
	);
}
