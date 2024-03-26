import type { CustomTooltipProps } from '@tremor/react';
import clsx from 'clsx';

export function Tooltip({ active, label, payload }: CustomTooltipProps) {
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
