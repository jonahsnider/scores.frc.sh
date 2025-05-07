import createFetchClient from 'openapi-fetch';
import createClient from 'openapi-react-query';
import type { components, paths } from './openapi';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiBaseUrl) {
	throw new TypeError('NEXT_PUBLIC_API_URL is not set');
}

const fetchClient = createFetchClient<paths>({
	baseUrl: apiBaseUrl,
});
export const api = createClient(fetchClient);

export type MatchLevel = components['schemas']['EventMatch']['level'];
