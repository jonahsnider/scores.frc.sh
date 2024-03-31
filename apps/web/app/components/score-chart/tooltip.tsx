import { Card, Strong, Text } from '@radix-ui/themes';
import type { CustomTooltipProps } from '@tremor/react';
import clsx from 'clsx';

export function Tooltip({ active, payload }: CustomTooltipProps) {
	if (!(active && payload)) {
		return undefined;
	}

	return (
		<Card>
			{payload.map((category) => (
				<div key={category.name} className='flex flex-1 space-x-2.5'>
					<div className={clsx('flex w-1 flex-col rounded', `bg-${category.color}-500`)} />
					<div className='flex flex-col gap-1'>
						<Text>
							<Strong>{category.payload.eventName}</Strong> - {category.payload.eventCode} - {category.payload.match}
						</Text>
						<Text>
							<Strong>{category.value} points</Strong>, {category.payload.recordHeldFor}
						</Text>
						<Text>
							<Strong>Winning teams:</Strong> {category.payload.winningTeams.join(', ')}
						</Text>
					</div>
				</div>
			))}
		</Card>
	);
}
