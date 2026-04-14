import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite-plus';

const config = defineConfig({
	staged: {
		'*': 'vp check --fix',
	},
	fmt: {
		useTabs: true,
		singleQuote: true,
		printWidth: 120,
		ignorePatterns: ['src/components/ui/**/*', '**/routeTree.gen.ts', 'convex/_generated/**/*'],
	},
	lint: {
		ignorePatterns: ['src/components/ui/**/*', '**/routeTree.gen.ts', 'convex/_generated/**/*'],
	},
	resolve: {
		tsconfigPaths: true,
	},
	plugins: [devtools(), nitro(), tailwindcss(), tanstackStart(), viteReact()],
});

export default config;
