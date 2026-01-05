import { up } from 'up-fetch';
import { z } from 'zod';
import { env } from './env';

const http = up(fetch, () => ({
	baseUrl: 'https://www.thebluealliance.com/api/v3',
	headers: {
		'X-TBA-Auth-Key': env.TBA_API_KEY,
	},
}));

/** Event type in The Blue Alliance API */
export enum TbaEventType {
	Regional = 0,
	District = 1,
	DistrictCmp = 2,
	CmpDivision = 3,
	CmpFinals = 4,
	DistrictCmpDivision = 5,
	Foc = 6,
	Remote = 7,
	Offseason = 99,
	Preseason = 100,
	Unlabeled = -1,
}

const TbaEvent = z.object({
	week: z.number().nullable(),
	short_name: z.string().nullable(),
	name: z.string(),
	event_code: z.string(),
	first_event_code: z.string().nullable(),
	event_type: z.nativeEnum(TbaEventType),
	year: z.number(),
});
export type TbaEvent = z.infer<typeof TbaEvent>;

const TbaEvents = z.array(TbaEvent);

export async function getEventsForYear(year: number): Promise<TbaEvent[]> {
	return http(`/events/${year}`, {
		schema: TbaEvents,
	});
}
