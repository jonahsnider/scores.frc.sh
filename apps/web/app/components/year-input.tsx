'use client';

import { mapFill } from '@jonahsnider/util';
import { Select } from '@radix-ui/themes';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DEFAULT_YEAR, MAX_YEAR, MIN_YEAR } from '../constants';

export function YearInput() {
	const router = useRouter();

	const params = useParams<{ year?: string; eventCode?: string }>();

	const currentYear = params.year ?? DEFAULT_YEAR;

	const [selected, setSelected] = useState(currentYear.toString());

	// Navigating using something other than this select (ex. clicking title in nav) should reset the selection
	useEffect(() => {
		setSelected(currentYear.toString());
	}, [currentYear]);

	const onValueChange = (value: string) => {
		setSelected(value);

		if (params.eventCode) {
			router.push(`/${value}/${encodeURIComponent(params.eventCode)}`);
		} else if (value === DEFAULT_YEAR.toString()) {
			router.push('/');
		} else {
			router.push(`/${value}`);
		}
	};

	return (
		<Select.Root size={{ initial: '2', xs: '3' }} value={selected} onValueChange={onValueChange}>
			<Select.Trigger />

			<Select.Content>
				{mapFill((index) => MAX_YEAR - index, MAX_YEAR - MIN_YEAR + 1).map((year) => (
					<Select.Item key={year} value={year.toString()}>
						{year}
					</Select.Item>
				))}
			</Select.Content>
		</Select.Root>
	);
}
