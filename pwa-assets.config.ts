import path from 'node:path';
import { defineConfig } from '@vite-pwa/assets-generator/config';

// NOTE: Bun is a bad package manager and isn't able to install the correct binary for sharp on my M1 Mac
// If you want to run the icon generation script, you need to run npm install and then run the binary through npm

const ROOT = path.join(__dirname, 'apps', 'web');

export default defineConfig({
	preset: {
		transparent: {
			sizes: [64, 144, 192, 256, 512],
		},
		maskable: {
			sizes: [64, 144, 192, 256, 512],
			padding: 0.3,
			resizeOptions: {
				background: '#121212',
			},
		},
		assetName(type, size) {
			return path.join(ROOT, 'public', `icons/${type}-${size.width}x${size.height}.png`);
		},
		apple: {
			sizes: [],
		},
	},
	images: [path.join(ROOT, 'app', 'icon.svg')],
	root: ROOT,
});
