import { mapFill } from '@jonahsnider/util';
import { Select } from '@radix-ui/themes';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useEffect } from 'react';

type Props = {
	onValueChange: (value: number) => void;
};

const MIN_YEAR = 2023;
const MAX_YEAR = new Date().getFullYear();

export const DEFAULT_YEAR = MAX_YEAR;

export function YearInput({ onValueChange }: Props) {
	const [year, setYearRaw] = useQueryState('year', parseAsInteger.withDefault(DEFAULT_YEAR));
	const setYear = (value: string) => setYearRaw(Number(value) === DEFAULT_YEAR ? null : Number(value));

	useEffect(() => {
		onValueChange(year);
	}, [year, onValueChange]);

	return (
		<Select.Root value={year.toString()} onValueChange={(value) => setYear(value)} size={{ initial: '2', xs: '3' }}>
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
