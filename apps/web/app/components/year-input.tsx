import { mapFill } from '@jonahsnider/util';
import { Select } from '@radix-ui/themes';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Props = {
	onValueChange: (value: number) => void;
};

const MIN_YEAR = 2023;
const MAX_YEAR = new Date().getFullYear();

export const DEFAULT_YEAR = MAX_YEAR;

export function YearInput({ onValueChange }: Props) {
	const searchParams = useSearchParams();
	const router = useRouter();

	const [year, setYearRaw] = useState(Number(searchParams.get('year') ?? DEFAULT_YEAR));
	const setYear = (value: string) => setYearRaw(Number(value));

	useEffect(() => {
		const url = new URL(window.location.href);

		if (year === DEFAULT_YEAR) {
			url.searchParams.delete('year');
		} else {
			url.searchParams.set('year', year.toString());
		}
		router.replace(url.href);
	}, [year, router]);

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
