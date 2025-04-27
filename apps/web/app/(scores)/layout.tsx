import type { PropsWithChildren } from 'react';
import { EventInput } from '../components/event-input';
import { YearInput } from '../components/year-input';

export default function ScoresLayout({ children }: PropsWithChildren) {
	return (
		<div className='flex flex-col gap-4 justify-center items-center w-full pt-2'>
			<div className='flex gap-4'>
				<YearInput />

				<EventInput />
			</div>

			{children}
		</div>
	);
}
