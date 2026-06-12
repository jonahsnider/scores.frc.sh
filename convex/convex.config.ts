import { defineApp } from 'convex/server';
import { v } from 'convex/values';

const app = defineApp({
	env: {
		FRC_EVENTS_API_KEY: v.string(),
		FRC_EVENTS_USERNAME: v.string(),
		TBA_API_KEY: v.string(),
	},
});

export default app;
