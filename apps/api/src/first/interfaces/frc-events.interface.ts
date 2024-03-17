import type { FrcAllianceCount } from '../enums/alliance-count.enum';

export type FrcEvents = {
	// biome-ignore lint/style/useNamingConvention: This is an external API
	Events: FrcEvent[];
};

export type FrcEvent = {
	allianceCount: FrcAllianceCount;
	weekNumber: number;
	announcements: unknown[];
	code: string;
	divisionCode: null | string;
	name: string;
	type: string;
	districtCode: string;
	venue: string;
	city: string;
	stateprov: string;
	country: string;
	dateStart: string;
	dateEnd: string;
	address: string;
	website: string;
	webcasts: string[];
	timezone: string;
};
