import { EventCode } from '@scores.frc.sh/api/src/high-scores/dtos/event-code.dto';
import { RedirectType, redirect } from 'next/navigation';
import type { PropsWithChildren } from 'react';

export default async function YearEventLayout(
	props: PropsWithChildren<{ params: Promise<{ year: string; eventCode: string }> }>,
) {
	const params = await props.params;

	const { children } = props;

	if (!EventCode.safeParse(params.eventCode).success) {
		redirect(`/${params.year}`, RedirectType.push);
	}

	return children;
}
