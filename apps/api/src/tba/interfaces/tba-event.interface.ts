import type { TbaEventTypeName } from '../enums/tba-event-type-name.enum';
import type { TbaEventType } from '../enums/tba-event-type.enum';

export type TbaEvent = {
	address: string;
	city: string;
	country: string;
	district: null | TbaEventDistrict;
	division_keys: string[];
	end_date: string;
	event_code: string;
	event_type: TbaEventType;
	event_type_string: TbaEventTypeName;
	first_event_code: string | null;
	first_event_id: null;
	gmaps_place_id: string | null;
	gmaps_url: string | null;
	key: string;
	lat: number | null;
	lng: number | null;
	location_name: string | null;
	name: string;
	parent_event_key: null | string;
	playoff_type: number | null;
	playoff_type_string: string | null;
	postal_code: string | null;
	short_name: string | null;
	start_date: string;
	state_prov: string;
	timezone: string;
	webcasts: TbaEventWebcast[];
	website: string | null;
	week: 0 | 1 | 2 | 3 | 4 | 5 | null;
	year: number;
};

export type TbaEventDistrict = {
	abbreviation: string;
	display_name: string;
	key: string;
	year: number;
};

export type TbaEventWebcast = {
	channel: string;
	type: string;
};
