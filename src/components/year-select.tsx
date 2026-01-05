'use client';

import { useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_YEAR, MAX_YEAR, MIN_YEAR } from '@/lib/constants';

export function YearSelect() {
	const navigate = useNavigate();
	const params = useParams({ strict: false }) as {
		year?: string;
		eventCode?: string;
	};

	const currentYear = params.year ?? DEFAULT_YEAR.toString();

	const [selected, setSelected] = useState(currentYear);

	// Navigating using something other than this select (ex. clicking title in nav) should reset the selection
	useEffect(() => {
		setSelected(currentYear);
	}, [currentYear]);

	const years = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, index) => MAX_YEAR - index);

	const onValueChange = (value: string | null) => {
		if (!value) return;

		setSelected(value);

		if (params.eventCode) {
			navigate({
				to: '/$year/$eventCode',
				params: { year: value, eventCode: params.eventCode },
			});
		} else if (value === DEFAULT_YEAR.toString()) {
			navigate({ to: '/' });
		} else {
			navigate({ to: '/$year', params: { year: value } });
		}
	};

	return (
		<Select value={selected} onValueChange={onValueChange}>
			<SelectTrigger className="w-24">
				<SelectValue />
			</SelectTrigger>

			<SelectContent>
				{years.map((year) => (
					<SelectItem key={year} value={year.toString()}>
						{year}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
