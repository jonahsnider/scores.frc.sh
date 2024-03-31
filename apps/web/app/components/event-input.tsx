import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { TextField } from '@radix-ui/themes';
import clsx from 'clsx';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { trpc } from '../trpc';

type Props = {
	year: number;
	onValueChange: (value: string | undefined) => void;
};

export function EventInput({ onValueChange, year }: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [eventCode, setEventCodeRaw] = useState<string | undefined>(
		searchParams.get('eventCode')?.toUpperCase() ?? undefined,
	);

	const setEventCode = (value: string) => setEventCodeRaw(value === '' ? undefined : value.toUpperCase());

	const matches = trpc.highScores.getHighScores.useQuery({
		year,
		eventCode,
	});

	useEffect(() => {
		const url = new URL(window.location.href);

		if (eventCode) {
			url.searchParams.set('event_code', eventCode.toLowerCase());
		} else {
			url.searchParams.delete('event_code');
		}

		router.replace(url.href);
	}, [eventCode, router]);

	useEffect(() => {
		onValueChange(eventCode);
	}, [eventCode, onValueChange]);

	const isError = matches.isSuccess && matches.data === null;

	return (
		<TextField.Root
			size={{ initial: '2', xs: '3' }}
			placeholder='Event code (optional)'
			value={eventCode ?? ''}
			onChange={(event) => setEventCode(event.target.value)}
			type='text'
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
