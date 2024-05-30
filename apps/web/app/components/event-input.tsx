'use client';

import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { TextField } from '@radix-ui/themes';
import clsx from 'clsx';
import { useContext } from 'react';
import { QueryContext } from '../contexts/query/query-context';
import { trpc } from '../trpc';

export function EventInput() {
	const { year, eventCode, setEventCode } = useContext(QueryContext);

	const matches = trpc.highScores.getHighScores.useQuery({
		year,
		eventCode: eventCode ?? undefined,
	});

	const isError = matches.data === null;

	return (
		<TextField.Root
			size={{ initial: '2', xs: '3' }}
			placeholder='Event code (optional)'
			value={eventCode ?? ''}
			onChange={(event) => setEventCode(event.target.value)}
			type='text'
			color={isError ? 'red' : undefined}
		>
			<TextField.Slot
				color='red'
				side='right'
				className={clsx({
					invisible: !isError,
				})}
			>
				<ExclamationTriangleIcon height='16' width='16' />
			</TextField.Slot>
		</TextField.Root>
	);
}
