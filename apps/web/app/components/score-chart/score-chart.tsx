import type { MatchLevel } from '@scores.frc.sh/api/src/first/enums/match-level.enum';
import { AreaChart, Card } from '@tremor/react';
import { trpc } from '../../trpc';
import { Tooltip } from './tooltip';
import { formatMatch, formatRecordHeldFor, tbaUrl, weekName } from './util';

type Props = {
	year: number;
	eventCode?: string;
};

const CATEGORY_WHEN_EVENT_PROVIDED = 'Score';

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
		<Card className='flex flex-col gap-4 p-2 sm:p-4 md:p-6 max-w-5xl'>
			<h3 className='text-lg font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong'>
				{!eventCode && <>Global high scores for {year}</>}
				{eventCode && (
					<>
						High scores for {eventCode} {year}
					</>
				)}
			</h3>

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
