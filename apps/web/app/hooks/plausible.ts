import { usePlausible as baseUsePlausible } from 'next-plausible';

export type PlausibleEvents = {
	'View global stats': { year: number };
	'View event stats': { year: number; eventCode: string };
};

export const usePlausible = () => baseUsePlausible<PlausibleEvents>();
