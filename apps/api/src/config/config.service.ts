import { Injectable } from '@nestjs/common';
import { url, cleanEnv, port, str } from 'envalid';

type NodeEnv = 'production' | 'development' | 'staging';

@Injectable()
export class ConfigService {
	public readonly nodeEnv: NodeEnv;
	public readonly frcEventsApi: Readonly<{ username: string; password: string }>;
	public readonly port: number;
	public readonly databaseUrl: string;
	public readonly sentryDsn: string;
	public readonly redis: {
		readonly url: string;
		readonly host: string;
		readonly port: number;
		readonly password: string;
		readonly username: string;
	};
	public readonly adminUsername: string;
	public readonly adminApiToken: string;
	public readonly websiteUrl: string;
	public readonly tbaApiKey: string;

	constructor() {
		const env = cleanEnv(process.env, {
			// biome-ignore lint/style/useNamingConvention: This is an environment variable
			FRC_EVENTS_USERNAME: str({ desc: 'Username for FRC Events API' }),
			// biome-ignore lint/style/useNamingConvention: This is an environment variable
			FRC_EVENTS_API_KEY: str({ desc: 'Password for FRC Events API' }),
			// biome-ignore lint/style/useNamingConvention: This is an environment variable
			NODE_ENV: str({ default: 'production', choices: ['production', 'development', 'staging'] }),
			// biome-ignore lint/style/useNamingConvention: This is an environment variable
			PORT: port({ default: 3000 }),
			// biome-ignore lint/style/useNamingConvention: This is an environment variable
			DATABASE_URL: url({ desc: 'PostgreSQL URL' }),
			// biome-ignore lint/style/useNamingConvention: This is an environment variable
			SENTRY_DSN: url({ desc: 'Sentry DSN' }),
			// biome-ignore lint/style/useNamingConvention: This is an environment variable
			REDIS_URL: url({ desc: 'Redis URL' }),
			// biome-ignore lint/style/useNamingConvention: This is an environment variable
			ADMIN_USERNAME: str({ desc: 'Admin username' }),
			// biome-ignore lint/style/useNamingConvention: This is an environment variable
			ADMIN_API_TOKEN: str({ desc: 'Admin API token' }),
			// biome-ignore lint/style/useNamingConvention: This is an environment variable
			WEBSITE_URL: url({ desc: 'Website URL' }),
			// biome-ignore lint/style/useNamingConvention: This is an environment variable
			TBA_API_KEY: str({ desc: 'The Blue Alliance API key' }),
		});

		this.nodeEnv = env.NODE_ENV;
		this.frcEventsApi = {
			username: env.FRC_EVENTS_USERNAME,
			password: env.FRC_EVENTS_API_KEY,
		};
		this.port = env.PORT;
		this.databaseUrl = env.DATABASE_URL;
		this.sentryDsn = env.SENTRY_DSN;
		this.adminUsername = env.ADMIN_USERNAME;
		this.adminApiToken = env.ADMIN_API_TOKEN;
		this.websiteUrl = env.WEBSITE_URL;
		this.tbaApiKey = env.TBA_API_KEY;

		const redisUrl = new URL(env.REDIS_URL);

		this.redis = {
			url: env.REDIS_URL,
			host: redisUrl.hostname,
			port: Number(redisUrl.port),
			password: redisUrl.password,
			username: redisUrl.username,
		};
	}
}
