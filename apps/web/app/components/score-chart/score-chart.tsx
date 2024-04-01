import { Card, Heading } from '@radix-ui/themes';
import type { MatchLevel } from '@scores.frc.sh/api/src/first/enums/match-level.enum';
import { AreaChart, type Color } from '@tremor/react';
import { trpc } from '../../trpc';
import { Tooltip } from './tooltip';
import { formatMatch, formatRecordHeldFor, tbaUrl, weekName } from './util';

type Props = {
	year: number;
	eventCode?: string;
};

const CATEGORY_WHEN_EVENT_PROVIDED = 'Score';

const GRAPH_COLORS: Color[] = ['emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet'];

export function ScoreChart({ year, eventCode }: Props) {
	const matches = trpc.highScores.getHighScores.useQuery({
		year,
		eventCode,
	});

	const chartData = (matches.data ?? []).map((match) => {
		const base = {
			time: match.timestamp.toLocaleString(),
			match: formatMatch(match.match.level, match.match.number),
			matchWithEvent: (eventCode ? '' : `${match.event.code} `) + formatMatch(match.match.level, match.match.number),
			eventCode: match.event.code,
			matchNumber: match.match.number,
			matchLevel: match.match.level,
			winningTeams: match.winningTeams,
			eventName: match.event.name,
			recordHeldFor: formatRecordHeldFor(match.recordHeldFor, eventCode),
		};

		return {
			...base,
			[CATEGORY_WHEN_EVENT_PROVIDED]: match.score,
			[weekName(match.event.weekNumber)]: match.score,
		};
	});

	let noDataText: string | undefined;

	if (matches.isPending) {
		noDataText = 'Loading data...';
	} else if (matches.isSuccess && eventCode) {
		noDataText = 'No event found';
	} else if (matches.isError) {
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
									(matches.data ?? []).map((match) => match.event.weekNumber).map((weekNumber) => weekName(weekNumber)),
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
