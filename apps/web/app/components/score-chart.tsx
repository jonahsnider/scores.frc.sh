import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { trpc } from '../trpc';

type Props = {
	year: number;
};

type ChartData = Array<{
	x: string;
	y: number;
}>;

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export function ScoreChart({ year }: Props) {
	const matches = trpc.highScores.getHighScores.useQuery(year, {
		initialData: [],
	});
	const chartData: ChartData = useMemo(
		() =>
			matches.data.map((match) => ({
				x: match.timestamp.toString(),
				y: match.score,
			})),
		[matches.data],
	);

	return (
		<Chart
			type='area'
			options={{
				theme: { mode: 'dark' },
				chart: {
					id: 'visits',
					background: 'transparent',
				},
				xaxis: {
					type: 'datetime',
				},
				yaxis: {
					labels: {
						formatter: (value) => value.toFixed(0),
					},
				},
				fill: {
					gradient: {
						shade: 'dark',
						opacityFrom: 0.6,
						opacityTo: 0,
						stops: [10, 90],
					},
				},
				dataLabels: { enabled: false },
				grid: {
					yaxis: {
						lines: {
							show: true,
						},
					},
					strokeDashArray: 4,
				},
			}}
			series={[
				{
					name: 'Points',
					data: chartData,
					color: '#0066B3',
				},
			]}
		/>
	);
}
