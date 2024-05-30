'use client';

import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { TextField } from '@radix-ui/themes';
import clsx from 'clsx';
import { useParams, useRouter } from 'next/navigation';
import { type ChangeEventHandler, useEffect, useState } from 'react';
import { DEFAULT_YEAR } from '../constants';
import { trpc } from '../trpc';

export function EventInput() {
	const router = useRouter();

	const params = useParams<{ year?: string; eventCode?: string }>();

	const year = params.year ? Number(params.year) : DEFAULT_YEAR;
	const eventCode = params.eventCode;

	const [value, setValue] = useState(eventCode ?? '');

	// Navigating using something other than this input (ex. clicking title in nav) should reset the input
	useEffect(() => {
		setValue(eventCode ?? '');
	}, [eventCode]);

	const onChange: ChangeEventHandler<HTMLInputElement> = (event) => {
		setValue(event.target.value);
		router.replace(`/${year}/${encodeURIComponent(event.target.value.toLowerCase())}`);
	};

	const matches = trpc.highScores.getHighScores.useQuery({
		year,
		eventCode: eventCode ?? undefined,
	});

	const isError = matches.data === null;

	return (
		<TextField.Root
			size={{ initial: '2', xs: '3' }}
			placeholder='Event code (optional)'
			onChange={onChange}
			value={value.toUpperCase()}
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
