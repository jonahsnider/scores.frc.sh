import type { ReactNode } from 'react';
import { EventInput } from '@/components/event-input';
import { YearSelect } from '@/components/year-select';

type Props = {
	children: ReactNode;
};

export function ScorePageLayout({ children }: Props) {
	return (
		<div className="flex flex-col gap-4 justify-center items-center w-full pt-2">
			<div className="flex gap-4">
				<YearSelect />
				<EventInput />
			</div>

			{children}
		</div>
	);
}
