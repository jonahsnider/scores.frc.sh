import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

const host = '127.0.0.1';
const port = 30_000 + (process.pid % 10_000);
const origin = `http://${host}:${port}`;
const server = spawn('vp', ['exec', 'wrangler', 'dev', '--local', '--ip', host, '--port', String(port)], {
	detached: true,
	env: {
		...process.env,
		NODE_ENV: 'production',
	},
	stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
server.stdout.setEncoding('utf8');
server.stderr.setEncoding('utf8');
server.stdout.on('data', (chunk) => (output += chunk));
server.stderr.on('data', (chunk) => (output += chunk));

async function request(path: string) {
	const deadline = Date.now() + 10_000;

	while (Date.now() < deadline) {
		if (server.exitCode !== null) {
			throw new Error(`Worker exited with code ${server.exitCode}.\n${output}`);
		}

		try {
			return await fetch(`${origin}${path}`);
		} catch {
			await delay(100);
		}
	}

	throw new Error(`Worker did not start within 10 seconds.\n${output}`);
}

try {
	const paths = ['/', `/${new Date().getFullYear()}`];

	for (const path of paths) {
		const response = await request(path);
		const body = await response.text();
		const renderedError = /new Error\("([^"]+)/.exec(body)?.[1];

		if (response.status !== 200) {
			const detail = renderedError ? `: ${renderedError}` : '';
			throw new Error(`${path} returned HTTP ${response.status}${detail}.\n${output}`);
		}

		if (body.includes('Something went wrong!')) {
			const detail = renderedError ? `: ${renderedError}` : '';
			throw new Error(`${path} rendered the application error boundary${detail}.\n${output}`);
		}
	}

	const icon = await request('/icon.svg');
	if (icon.status !== 200 || !icon.headers.get('content-type')?.includes('image/svg+xml')) {
		throw new Error(`/icon.svg was not served as an SVG asset (HTTP ${icon.status}).\n${output}`);
	}

	console.log(`Worker smoke test passed for ${paths.join(', ')} and /icon.svg`);
} finally {
	if (server.exitCode === null) {
		const exited = once(server, 'exit');
		process.kill(-server.pid!, 'SIGTERM');
		const stopped = await Promise.race([exited.then(() => true), delay(2_000).then(() => false)]);

		if (!stopped && server.exitCode === null) {
			process.kill(-server.pid!, 'SIGKILL');
			await once(server, 'exit');
		}
	}
}
