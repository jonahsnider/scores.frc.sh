import type { Config } from 'tailwindcss';

const config: Config = {
	content: ['./app/**/*.{js,ts,jsx,tsx}'],
};

// biome-ignore lint/style/noDefaultExport: This has to be a default export
export default config;
