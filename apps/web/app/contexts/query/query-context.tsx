'use client';

import { parseAsInteger, useQueryState } from 'nuqs';
import { type PropsWithChildren, createContext, useMemo } from 'react';
import { DEFAULT_YEAR } from './constants';

type ContextValue = {
	year: number;
	eventCode?: string;
	setYear: (value: number | undefined) => void;
	setEventCode: (value: string | undefined) => void;
};

export const QueryContext = createContext<ContextValue>({
	year: DEFAULT_YEAR,
	eventCode: undefined,
	setYear: () => {},
	setEventCode: () => {},
});

export function QueryProvider({ children }: PropsWithChildren) {
	const [year, setYearRaw] = useQueryState(
		'year',
		parseAsInteger.withDefault(DEFAULT_YEAR).withOptions({ clearOnDefault: true }),
	);
	const [eventCode, setEventCodeRaw] = useQueryState('event_code', { clearOnDefault: true });

	const setYear = (value: number | undefined) => setYearRaw(value ?? null);
	const setEventCode = (value: string | undefined) => setEventCodeRaw(value ?? null);

	const contextValue = useMemo(
		() => ({
			year,
			eventCode: eventCode ?? undefined,
			setYear,
			setEventCode,
		}),
		[year, eventCode, setYear, setEventCode],
	);

	return <QueryContext.Provider value={contextValue}>{children}</QueryContext.Provider>;
}
