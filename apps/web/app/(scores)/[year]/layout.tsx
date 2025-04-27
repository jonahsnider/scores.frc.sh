import { EventYear } from '@scores.frc.sh/api/src/high-scores/dtos/event-year.dto';
import { RedirectType, redirect } from 'next/navigation';
import type { PropsWithChildren } from 'react';

export default async function YearLayout(props: PropsWithChildren<{ params: Promise<{ year: string }> }>) {
	const params = await props.params;

	const { children } = props;

	const parsed = EventYear.safeParse(params.year);

	if (!parsed.success) {
		redirect('/', RedirectType.push);
	}

	return children;
}
