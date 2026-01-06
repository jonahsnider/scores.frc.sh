import { cleanEnv, str } from 'envalid';

export const env = cleanEnv(process.env, {
	FRC_EVENTS_API_KEY: str({ desc: 'The API key for the FIRST Events API' }),
	FRC_EVENTS_USERNAME: str({ desc: 'The username for the FIRST Events API' }),
	TBA_API_KEY: str({ desc: 'The API key for The Blue Alliance API' }),
});
