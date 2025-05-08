'use client';

import { type MatchLevel, api } from '@/app/api/api';
import { Card, Heading } from '@radix-ui/themes';
import { AreaChart, type Color } from '@tremor/react';
import { Tooltip } from './tooltip';
import { formatMatch, formatRecordHeldFor, tbaUrl, weekName } from './util';

const CATEGORY_WHEN_EVENT_PROVIDED = 'Score';

const GRAPH_COLORS: Color[] = ['emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet'];

type Props = {
	year: number;
	eventCode?: string;
};

export function ScoreChart({ year, eventCode }: Props) {
	const globalMatches = api.useQuery(
		'get',
		'/scores/year/{year}',
		{
			params: { path: { year } },
		},
		{ enabled: eventCode === undefined },
	);
	const eventMatches = api.useQuery(
		'get',
		'/scores/year/{year}/event/{event}',
		{
			params: { path: { year, event: eventCode ?? '' } },
		},
		{ enabled: eventCode !== undefined },
	);
	const usedMatchesQuery = eventCode === undefined ? globalMatches : eventMatches;

	const chartData = (usedMatchesQuery.data?.highScores ?? []).map((match) => {
		if (!match.result) {
			throw new TypeError('Match has no result');
		}

		const base = {
			time: match.result.timestamp.toLocaleString(),
			match: formatMatch(match.level, match.number),
			matchWithEvent: (eventCode ? '' : `${match.event.code} `) + formatMatch(match.level, match.number),
			eventCode: match.event.code,
			matchNumber: match.number,
			matchLevel: match.level,
			winningTeams: match.result.winningTeams,
			eventName: match.event.name,
			recordHeldFor: formatRecordHeldFor(match.result.recordHeldFor, eventCode),
		};

		return {
			...base,
			[CATEGORY_WHEN_EVENT_PROVIDED]: match.result.score,
			[weekName(match.event.weekNumber)]: match.result.score,
		};
	});

	let noDataText: string | undefined;

	if (usedMatchesQuery.isPending) {
		noDataText = 'Loading data...';
	} else if (usedMatchesQuery.isSuccess && eventCode) {
		noDataText = 'No event found';
	} else if (usedMatchesQuery.isError) {
		noDataText = 'Error loading data';
	} else {
		noDataText = undefined;
	}

	return (
		<Card className='flex flex-col gap-1 w-full max-w-5xl' size={{ initial: '1', xs: '2', sm: '3', md: '4' }}>
			<Heading as='h3' size={{ initial: '4', xs: '5', sm: '6' }}>
				{!eventCode && <>Global high scores for {year}</>}
				{eventCode && (
					<>
						High scores for {eventCode} {year}
					</>
				)}
			</Heading>

			<AreaChart
				data={chartData}
				index='matchWithEvent'
				noDataText={noDataText}
				className='h-96'
				categories={
					eventCode
						? [CATEGORY_WHEN_EVENT_PROVIDED]
						: [
								...new Set(
									(usedMatchesQuery.data?.highScores ?? [])
										.map((match) => match.event.weekNumber)
										.map((weekNumber) => weekName(weekNumber)),
								),
							]
				}
				valueFormatter={(x) => `${x.toLocaleString()} pts`}
				customTooltip={Tooltip}
				intervalType='preserveStartEnd'
				animationDuration={500}
				showAnimation={true}
				minValue={0}
				enableLegendSlider={true}
				colors={GRAPH_COLORS}
				onValueChange={(value) => {
					// Open new tab with TBA match page
					if (!(value?.eventCode && value.matchNumber && value.matchLevel)) {
						return;
					}

					const url = tbaUrl(
						year,
						value.eventCode as string,
						value.matchNumber as number,
						value.matchLevel as MatchLevel,
					);

					window.open(url, '_blank');
				}}
			/>
		</Card>
	);
}
