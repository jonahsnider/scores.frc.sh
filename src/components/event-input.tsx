'use client';

import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { TriangleAlertIcon } from 'lucide-react';
import { type ChangeEventHandler, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { DEFAULT_YEAR } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { api } from '../../convex/_generated/api';

export function EventInput() {
	const navigate = useNavigate();
	const params = useParams({ strict: false }) as {
		year?: string;
		eventCode?: string;
	};

	const year = params.year ? Number(params.year) : DEFAULT_YEAR;
	const eventCode = params.eventCode;

	const [value, setValue] = useState(eventCode ?? '');

	// Navigating using something other than this input (ex. clicking title in nav) should reset the input
	useEffect(() => {
		setValue(eventCode ?? '');
	}, [eventCode]);

	const onChange: ChangeEventHandler<HTMLInputElement> = (event) => {
		const newValue = event.target.value;
		setValue(newValue);

		if (newValue) {
			navigate({
				to: '/$year/$eventCode',
				params: { year: year.toString(), eventCode: newValue.toLowerCase() },
				replace: true,
			});
		} else if (year === DEFAULT_YEAR) {
			navigate({ to: '/', replace: true });
		} else {
			navigate({
				to: '/$year',
				params: { year: year.toString() },
				replace: true,
			});
		}
	};

	const eventRecordsQuery = useQuery(
		convexQuery(api.scores.eventRecords, eventCode ? { year, eventCode: eventCode.toUpperCase() } : 'skip'),
	);

	const isError = eventCode && eventRecordsQuery.data === null;

	return (
		<div className="relative">
			<Input
				placeholder="Event code (optional)"
				onChange={onChange}
				value={value.toUpperCase()}
				type="text"
				className={cn({ 'border-destructive focus-visible:border-destructive': isError })}
			/>
			<TriangleAlertIcon
				className={cn('absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-destructive', { invisible: !isError })}
			/>
		</div>
	);
}
