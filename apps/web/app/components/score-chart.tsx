import dynamic from 'next/dynamic';
import { trpc } from '../trpc';

type Props = {
	year: number;
	eventCode?: string;
};

type ChartData = Array<{
	x: string;
	y: number;
}>;

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export function ScoreChart({ year, eventCode }: Props) {
	const matches = trpc.highScores.getHighScores.useQuery({
		year,
		eventCode,
	});

	const chartData: ChartData = (matches.data ?? []).map((match) => ({
		x: match.timestamp.toString(),
		y: match.score,
	}));

	if (matches.isError) {
		return <p>Error loading data</p>;
	}

	if (matches.isPending) {
		return <p>Loading...</p>;
	}

	if (matches.isSuccess && matches.data === null) {
		return <p>No event found</p>;
	}

	// TODO: Render differently for multi-week (global) scores

	return (
		<div className='w-full max-w-4xl min-h-96 rounded shadow bg-neutral-800 py-4 px-1'>
			<Chart
				type='area'
				height='100%'
				width='100%'
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
						min: 0,
						max: matches.data ? undefined : 100,
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
		</div>
	);
}
