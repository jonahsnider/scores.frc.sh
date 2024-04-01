import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { TextField } from '@radix-ui/themes';
import clsx from 'clsx';
import { parseAsString, useQueryState } from 'nuqs';
import { useEffect } from 'react';
import { trpc } from '../trpc';

type Props = {
	year: number;
	onValueChange: (value: string | undefined) => void;
};

export function EventInput({ onValueChange, year }: Props) {
	const [eventCode, setEventCodeRaw] = useQueryState('event_code', parseAsString);

	const setEventCode = (value: string) => setEventCodeRaw(value === '' ? null : value.toUpperCase());

	const matches = trpc.highScores.getHighScores.useQuery({
		year,
		eventCode: eventCode ?? undefined,
	});

	useEffect(() => {
		onValueChange(eventCode ?? undefined);
	}, [eventCode, onValueChange]);

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
