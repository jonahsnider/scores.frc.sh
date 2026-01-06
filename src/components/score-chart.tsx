'use client';

import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	type ChartConfig,
	ChartContainer,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart';
import { formatMatch, formatRecordHeldFor, tbaUrl, weekKey, weekName } from '@/lib/chart-utils';
import { api } from '../../convex/_generated/api';
import type { MatchLevel } from '../../convex/schema';

type Props = {
	year: number;
	eventCode?: string;
};

// Color palette using Tailwind colors
const WEEK_COLORS = [
	'var(--color-emerald-500)',
	'var(--color-teal-500)',
	'var(--color-cyan-500)',
	'var(--color-sky-500)',
	'var(--color-blue-500)',
	'var(--color-indigo-500)',
	'var(--color-violet-500)',
];

const singleSeriesConfig = {
	score: {
		label: 'Score',
		color: 'var(--color-emerald-500)',
	},
} satisfies ChartConfig;

export function ScoreChart({ year, eventCode }: Props) {
	const globalRecordsQuery = useQuery(convexQuery(api.scores.worldRecordsByYear, eventCode ? 'skip' : { year }));
	const eventRecordsQuery = useQuery(convexQuery(api.scores.eventRecords, eventCode ? { year, eventCode } : 'skip'));

	const usedQuery = eventCode === undefined ? globalRecordsQuery : eventRecordsQuery;
	const records = usedQuery.data ?? [];

	// Extract unique week numbers from the data (for global view)
	const weekNumbers = useMemo(() => {
		if (eventCode) return [];
		return [...new Set(records.map((r) => r.event.weekNumber))].sort((a, b) => a - b);
	}, [records, eventCode]);

	// Build dynamic chart config for week-based series (colors auto-set CSS vars via ChartStyle)
	const chartConfig = useMemo<ChartConfig>(() => {
		if (eventCode) return singleSeriesConfig;

		return Object.fromEntries(
			weekNumbers.map((weekNum, index) => [
				weekKey(weekNum),
				{ label: weekName(weekNum), color: WEEK_COLORS[index % WEEK_COLORS.length] },
			]),
		);
	}, [weekNumbers, eventCode]);

	// Transform data: for global view, put score in week-specific field
	const chartData = records.map((record) => {
		const base = {
			matchWithEvent: (eventCode ? '' : `${record.event.code} `) + formatMatch(record.matchLevel, record.matchNumber),
			match: formatMatch(record.matchLevel, record.matchNumber),
			eventCode: record.event.code,
			eventName: record.event.name,
			matchNumber: record.matchNumber,
			matchLevel: record.matchLevel,
			winningTeams: record.result.winningTeams,
			recordHeldFor: formatRecordHeldFor(record.result.recordHeldFor, eventCode),
		};

		if (eventCode) {
			return { ...base, score: record.result.score };
		}

		return { ...base, [weekKey(record.event.weekNumber)]: record.result.score };
	});

	const statusText = usedQuery.isPending
		? 'Loading data...'
		: usedQuery.isError
			? 'Error loading data'
			: usedQuery.isSuccess && eventCode && usedQuery.data === null
				? 'No event found'
				: chartData.length === 0
					? 'No data available'
					: undefined;

	const handleChartClick = (data: {
		activePayload?: Array<{
			payload: { eventCode: string; matchNumber: number; matchLevel: MatchLevel };
		}>;
	}) => {
		const payload = data.activePayload?.[0]?.payload;
		if (payload) {
			window.open(tbaUrl(year, payload.eventCode, payload.matchNumber, payload.matchLevel), '_blank');
		}
	};

	const seriesToRender = eventCode ? ['score'] : weekNumbers.map(weekKey);

	const [isTooltipActive, setIsTooltipActive] = useState(false);

	return (
		<Card className="w-full max-w-5xl">
			<CardHeader>
				<CardTitle className="text-lg sm:text-xl md:text-2xl">
					{eventCode ? `High scores for ${eventCode.toUpperCase()} ${year}` : `Global high scores for ${year}`}
				</CardTitle>
			</CardHeader>

			<CardContent>
				{statusText ? (
					<div className="flex h-96 items-center justify-center text-muted-foreground">{statusText}</div>
				) : (
					<ChartContainer config={chartConfig} className={`h-96 w-full ${isTooltipActive ? '**:cursor-pointer' : ''}`}>
						<AreaChart
							accessibilityLayer
							data={chartData}
							onClick={handleChartClick}
							margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
							onMouseMove={(state) => setIsTooltipActive(state?.isTooltipActive === true)}
							onMouseLeave={() => setIsTooltipActive(false)}
						>
							<defs>
								{seriesToRender.map((series) => (
									<linearGradient key={series} id={`fill-${series}`} x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor={`var(--color-${series})`} stopOpacity={0.4} />
										<stop offset="95%" stopColor={`var(--color-${series})`} stopOpacity={0} />
									</linearGradient>
								))}
							</defs>
							<CartesianGrid vertical={false} />
							<XAxis
								dataKey="matchWithEvent"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								minTickGap={32}
								interval="preserveStartEnd"
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								domain={[0, 'auto']}
								tickFormatter={(score) => `${score} pts`}
							/>
							<ChartTooltip
								cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
								position={{ y: 0 }}
								content={
									<ChartTooltipContent
										hideLabel
										formatter={(value, name, item) => {
											const data = item.payload as (typeof chartData)[number];
											return (
												<div className="flex flex-1 space-x-2.5">
													<div
														className="flex w-1 flex-col rounded"
														style={{ backgroundColor: `var(--color-${name})` }}
													/>
													<div className="flex flex-col gap-1 md:text-lg">
														<div>
															<span className="font-semibold">{data.eventName}</span>
															<span className="text-muted-foreground">
																{' '}
																- {data.eventCode} - {data.match}
															</span>
														</div>
														<div>
															<span className="font-semibold">{value} points</span>
															<span className="text-muted-foreground">, {data.recordHeldFor}</span>
														</div>
														<div>
															<span className="font-semibold">Winning teams:</span>{' '}
															<span className="text-muted-foreground">{data.winningTeams.join(', ')}</span>
														</div>
													</div>
												</div>
											);
										}}
									/>
								}
							/>
							{!eventCode && weekNumbers.length > 1 && (
								<Legend
									verticalAlign="top"
									align="right"
									content={<ChartLegendContent verticalAlign="top" align="right" />}
								/>
							)}
							{seriesToRender.map((series) => (
								<Area
									key={series}
									dataKey={series}
									type="monotone"
									stroke={`var(--color-${series})`}
									strokeWidth={2}
									fill={`url(#fill-${series})`}
									dot={{
										fill: `var(--color-${series})`,
										stroke: 'var(--background)',
										strokeWidth: 2,
										r: 4,
										fillOpacity: 1,
									}}
									activeDot={{ fill: `var(--color-${series})`, stroke: 'var(--background)', strokeWidth: 2, r: 6 }}
									isAnimationActive
									animationDuration={500}
								/>
							))}
						</AreaChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	);
}
