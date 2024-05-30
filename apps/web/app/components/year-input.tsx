'use client';

import { mapFill } from '@jonahsnider/util';
import { Select } from '@radix-ui/themes';
import { useContext } from 'react';
import { DEFAULT_YEAR, MAX_YEAR, MIN_YEAR } from '../contexts/query/constants';
import { QueryContext } from '../contexts/query/query-context';

export function YearInput() {
	const { year, setYear } = useContext(QueryContext);

	return (
		<Select.Root
			value={year.toString()}
			onValueChange={(value) => setYear(Number(value))}
			size={{ initial: '2', xs: '3' }}
			defaultValue={DEFAULT_YEAR.toString()}
		>
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
