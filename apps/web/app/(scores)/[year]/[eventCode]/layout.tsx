import { EventCode } from '@scores.frc.sh/api/src/high-scores/dtos/event-code.dto';
import { RedirectType, redirect } from 'next/navigation';
import type { PropsWithChildren } from 'react';

// biome-ignore lint/style/noDefaultExport: This has to be a default export
export default function YearEventLayout({
	params,
	children,
}: PropsWithChildren<{ params: { year: string; eventCode: string } }>) {
	if (!EventCode.safeParse(params.eventCode).success) {
		redirect(`/${params.year}`, RedirectType.push);
	}

	return children;
}
