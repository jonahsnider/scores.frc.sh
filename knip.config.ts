import type { KnipConfig } from 'knip';

const config: KnipConfig = {
	// Entry files for the application
	entry: [
		// TanStack Start/Router routes
		'src/routes/**/*.tsx',
		// PWA assets generator config
		'pwa-assets.config.ts',
		// Convex functions are entrypoints (accessed via function references)
		'convex/*.ts',
	],

	// Project source files
	project: ['src/**/*.{ts,tsx,css}', 'convex/**/*.ts'],

	// Ignore shadcn/ui components - they're generated/copied and intentionally kept as a library
	ignore: ['src/components/ui/**'],

	// Ignore dependencies that are used in ways Knip can't detect
	ignoreDependencies: [
		// Used in vite.config.ts via plugin
		'@tanstack/router-plugin',
		// Used for SSR with TanStack Router
		'@tanstack/react-router-ssr-query',
		// Used by shadcn/ui components for styling variants
		'class-variance-authority',
	],

	rules: {
		enumMembers: 'off',
	},
};

export default config;
