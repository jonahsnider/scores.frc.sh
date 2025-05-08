import { RedirectType, redirect } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { z } from 'zod';

const EventYear = z.number({ coerce: true }).min(2023).max(new Date().getFullYear());

export default async function YearLayout(props: PropsWithChildren<{ params: Promise<{ year: string }> }>) {
	const params = await props.params;

	const { children } = props;

	const parsed = EventYear.safeParse(params.year);

	if (!parsed.success) {
		redirect('/', RedirectType.push);
	}

	return children;
}
