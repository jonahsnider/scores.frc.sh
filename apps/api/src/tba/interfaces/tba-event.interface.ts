import type { TbaEventTypeName } from '../enums/tba-event-type-name.enum';
import type { TbaEventType } from '../enums/tba-event-type.enum';

export type TbaEvent = {
	address: string;
	city: string;
	country: string;
	district: null | TbaEventDistrict;
	// biome-ignore lint/style/useNamingConvention: This can't be renamed
	division_keys: string[];
	// biome-ignore lint/style/useNamingConvention: This can't be renamed
	end_date: string;
	// biome-ignore lint/style/useNamingConvention: This can't be renamed
	event_code: string;
	// biome-ignore lint/style/useNamingConvention: This can't be renamed
	event_type: TbaEventType;
	// biome-ignore lint/style/useNamingConvention: This can't be renamed
	event_type_string: TbaEventTypeName;
	// biome-ignore lint/style/useNamingConvention: This can't be renamed
	first_event_code: string | null;
	// biome-ignore lint/style/useNamingConvention: This can't be renamed
	first_event_id: null;
	// biome-ignore lint/style/useNamingConvention: This can't be renamed
	gmaps_place_id: string | null;
	// biome-ignore lint/style/useNamingConvention: This can't be renamed
	gmaps_url: string | null;
	key: string;
	lat: number | null;
	lng: number | null;
	// biome-ignore lint/style/useNamingConvention: This can't be renamed
	location_name: string | null;
	name: string;
	// biome-ignore lint/style/useNamingConvention: This can't be renamed
	parent_event_key: null | string;
	// biome-ignore lint/style/useNamingConvention: This can't be renamed
	playoff_type: number | null;
	// biome-ignore lint/style/useNamingConvention: This can't be renamed
	playoff_type_string: string | null;
	// biome-ignore lint/style/useNamingConvention: This can't be renamed
	postal_code: string | null;
	// biome-ignore lint/style/useNamingConvention: This can't be renamed
	short_name: string | null;
	// biome-ignore lint/style/useNamingConvention: This can't be renamed
	start_date: string;
	// biome-ignore lint/style/useNamingConvention: This can't be renamed
	state_prov: string;
	timezone: string;
	webcasts: TbaEventWebcast[];
	website: string | null;
	week: 0 | 1 | 2 | 3 | 4 | 5 | null;
	year: number;
};

export type TbaEventDistrict = {
	abbreviation: string;
	// biome-ignore lint/style/useNamingConvention: This can't be renamed
	display_name: string;
	key: string;
	year: number;
};

export type TbaEventWebcast = {
	channel: string;
	type: string;
};
