import { EventYear } from '@scores.frc.sh/api/src/high-scores/dtos/event-year.dto';
import { RedirectType, redirect } from 'next/navigation';
import type { PropsWithChildren } from 'react';

// biome-ignore lint/style/noDefaultExport: This has to be a default export
export default function YearLayout({ params, children }: PropsWithChildren<{ params: { year: string } }>) {
	const parsed = EventYear.safeParse(params.year);

	if (!parsed.success) {
		redirect('/', RedirectType.push);
	}

	return children;
}
