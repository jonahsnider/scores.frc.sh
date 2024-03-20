import { MatchLevel } from '@frc-colors/api/src/first/enums/match-level.enum';
import { AreaChart, Card, type CustomTooltipProps } from '@tremor/react';
import clsx from 'clsx';
import { trpc } from '../trpc';

type Props = {
	year: number;
	eventCode?: string;
};

// Note: this assume 2023 double elims bracket
function formatMatch(level: MatchLevel, number: number, eventCode?: string) {
	const prefix = eventCode ? `${eventCode} ` : '';

	if (level === MatchLevel.Qualification) {
		return `${prefix}Q${number}`;
	}

	switch (number) {
		case 14:
		case 15:
		case 16:
			return `${prefix}Finals ${number - 13}`;
		default:
			return `${prefix}Elims match ${number}`;
	}
}

function Tooltip({ active, label, payload }: CustomTooltipProps) {
	if (!(active && payload)) {
		return undefined;
	}

	return (
		<div className='w-64 rounded-tremor-default border border-tremor-border bg-tremor-background p-2 text-tremor-default shadow-tremor-dropdown'>
			{payload.map((category) => (
				<div key={category.name} className='flex flex-1 space-x-2.5'>
					<div className={clsx('flex w-1 flex-col rounded', `bg-${category.color}-500`)} />
					<div className='flex flex-col gap-1'>
						<p className='text-tremor-content'>{label}</p>
						<p className='font-medium text-tremor-content-emphasis'>{category.value} points</p>
						<p className='text-tremor-content-emphasis'>
							<span className='font-medium'>Winning teams:</span> {category.payload.winningTeams.join(', ')}
						</p>
					</div>
				</div>
			))}
		</div>
	);
}

function tbaUrl(year: number, eventCode: string, matchNumber: number, matchLevel: MatchLevel) {
	let urlMatchNumber: string;

	if (matchLevel === MatchLevel.Qualification) {
		urlMatchNumber = `qm${matchNumber}`;
	} else {
		switch (matchNumber) {
			case 14:
			case 15:
			case 16: {
				urlMatchNumber = `f${matchNumber - 13}`;
				break;
			}
			default: {
				urlMatchNumber = `sf${matchNumber}m1`;
				break;
			}
		}
	}

	return `https://www.thebluealliance.com/match/${year}${encodeURIComponent(
		eventCode.toLowerCase(),
	)}_${urlMatchNumber}`;
}

export function ScoreChart({ year, eventCode }: Props) {
	const matches = trpc.highScores.getHighScores.useQuery({
		year,
		eventCode,
	});

	const chartData = (matches.data ?? []).map((match) => {
		const base = {
			time: match.timestamp.toLocaleString(),
			match: formatMatch(match.match.level, match.match.number, eventCode ? undefined : match.event.code),
			eventCode: match.event.code,
			matchNumber: match.match.number,
			matchLevel: match.match.level,
			winningTeams: match.winningTeams,
		};

		if (eventCode) {
			return {
				...base,
				// biome-ignore lint/style/useNamingConvention: This has to be named like this since it's rendered directly
				Score: match.score,
			};
		}

		return {
			...base,
			[match.event.code]: match.score,
		};
	});

	let noDataText: string | undefined;

	if (matches.isPending) {
		noDataText = 'Loading data...';
	} else if (matches.isSuccess && eventCode) {
		noDataText = 'No event found';
	} else {
		noDataText = undefined;
	}

	return (
		<Card className='flex flex-col gap-4 h-96'>
			<h3 className='text-lg font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong'>
				{!eventCode && <>Global high scores for {year}</>}
				{eventCode && (
					<>
						High scores for {eventCode} {year}
					</>
				)}
			</h3>
			{matches.isError && <p>Error loading data</p>}
			{(matches.isPending || matches.isSuccess) && (
				<AreaChart
					data={chartData}
					index='match'
					noDataText={noDataText}
					yAxisWidth={80}
					categories={eventCode ? ['Score'] : [...new Set((matches.data ?? []).map((match) => match.event.code))]}
					valueFormatter={(x) => `${x.toLocaleString()} points`}
					customTooltip={Tooltip}
					intervalType='preserveStartEnd'
					animationDuration={500}
					showAnimation={true}
					minValue={0}
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
			)}
		</Card>
	);
}
