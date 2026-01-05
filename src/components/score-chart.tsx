'use client';

import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatMatch, formatRecordHeldFor, tbaUrl, weekName } from '@/lib/chart-utils';
import { api } from '../../convex/_generated/api';
import type { MatchLevel } from '../../convex/schema';

type Props = {
	year: number;
	eventCode?: string;
};

const chartConfig = {
	score: {
		label: 'Score',
		color: 'var(--chart-1)',
	},
} satisfies ChartConfig;

export function ScoreChart({ year, eventCode }: Props) {
	const globalRecordsQuery = useQuery({
		...convexQuery(api.scores.worldRecordsByYear, { year }),
		enabled: eventCode === undefined,
	});

	const eventRecordsQuery = useQuery({
		...convexQuery(api.scores.eventRecords, {
			year,
			eventCode: eventCode ?? '',
		}),
		enabled: eventCode !== undefined,
	});

	const usedQuery = eventCode === undefined ? globalRecordsQuery : eventRecordsQuery;
	const records = usedQuery.data ?? [];

	const chartData = records.map((record) => ({
		// X-axis label
		matchWithEvent: (eventCode ? '' : `${record.event.code} `) + formatMatch(record.matchLevel, record.matchNumber),
		// Data values
		score: record.result.score,
		weekCategory: weekName(record.event.weekNumber),
		// Tooltip data
		match: formatMatch(record.matchLevel, record.matchNumber),
		eventCode: record.event.code,
		eventName: record.event.name,
		matchNumber: record.matchNumber,
		matchLevel: record.matchLevel,
		winningTeams: record.result.winningTeams,
		recordHeldFor: formatRecordHeldFor(record.result.recordHeldFor, eventCode),
	}));

	let statusText: string | undefined;

	if (usedQuery.isPending) {
		statusText = 'Loading data...';
	} else if (usedQuery.isError) {
		statusText = 'Error loading data';
	} else if (usedQuery.isSuccess && eventCode && usedQuery.data === null) {
		statusText = 'No event found';
	} else if (chartData.length === 0) {
		statusText = 'No data available';
	}

	const handleChartClick = (data: {
		activePayload?: Array<{
			payload: {
				eventCode: string;
				matchNumber: number;
				matchLevel: MatchLevel;
			};
		}>;
	}) => {
		const payload = data.activePayload?.[0]?.payload;
		if (!payload) return;

		const url = tbaUrl(year, payload.eventCode, payload.matchNumber, payload.matchLevel);
		window.open(url, '_blank');
	};

	return (
		<Card className="w-full max-w-5xl">
			<CardHeader>
				<CardTitle className="text-lg sm:text-xl md:text-2xl">
					{!eventCode && <>Global high scores for {year}</>}
					{eventCode && (
						<>
							High scores for {eventCode.toUpperCase()} {year}
						</>
					)}
				</CardTitle>
			</CardHeader>

			<CardContent>
				{statusText ? (
					<div className="flex h-96 items-center justify-center text-muted-foreground">{statusText}</div>
				) : (
					<ChartContainer config={chartConfig} className="h-96 w-full">
						<AreaChart
							accessibilityLayer
							data={chartData}
							onClick={handleChartClick}
							margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
						>
							<defs>
								<linearGradient id="fillScore" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="var(--color-score)" stopOpacity={0.8} />
									<stop offset="95%" stopColor="var(--color-score)" stopOpacity={0.1} />
								</linearGradient>
							</defs>
							<CartesianGrid vertical={false} />
							<XAxis
								dataKey="matchWithEvent"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								minTickGap={32}
								tickFormatter={(value: string) => value}
							/>
							<YAxis tickLine={false} axisLine={false} tickMargin={8} />
							<ChartTooltip
								cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
								content={
									<ChartTooltipContent
										hideLabel
										formatter={(value, _name, item) => {
											const data = item.payload as (typeof chartData)[number];
											return (
												<div className="flex flex-1 space-x-2.5">
													<div className="flex w-1 flex-col rounded bg-(--color-score)" />
													<div className="flex flex-col gap-1 text-lg">
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
							<Area
								dataKey="score"
								type="monotone"
								stroke="var(--color-score)"
								strokeWidth={2}
								fill="url(#fillScore)"
								dot={{
									fill: 'var(--color-score)',
									strokeWidth: 0,
									r: 4,
								}}
								activeDot={{
									fill: 'var(--color-score)',
									stroke: 'var(--background)',
									strokeWidth: 2,
									r: 6,
								}}
							/>
						</AreaChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	);
}
