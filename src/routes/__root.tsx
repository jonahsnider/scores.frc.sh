import { TanStackDevtools } from '@tanstack/react-devtools';
import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, Outlet, ScriptOnce, Scripts } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { createClientOnlyFn, createIsomorphicFn } from '@tanstack/react-start';
import { useEffect } from 'react';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/constants';
import { initPlausible } from '@/lib/plausible';
import appCss from '../styles.css?url';

// Script to set theme before hydration to prevent flash
const themeScript = `
(function() {
  try {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.classList.add(systemTheme);
  } catch (e) {
    document.documentElement.classList.add('light');
  }
})();
`;

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
}>()({
	head: () => ({
		meta: [
			// Base meta tags
			{
				charSet: 'utf-8',
			},
			{
				name: 'viewport',
				content: 'width=device-width, initial-scale=1',
			},
			{
				title: SITE_NAME,
			},
			{
				name: 'description',
				content: SITE_DESCRIPTION,
			},
			{
				name: 'theme-color',
				content: '#101211',
			},
			// Open Graph defaults
			{
				property: 'og:type',
				content: 'website',
			},
			{
				property: 'og:site_name',
				content: SITE_NAME,
			},
			{
				property: 'og:image',
				content: `${SITE_URL}/opengraph-image.png`,
			},
			{
				property: 'og:image:width',
				content: '1200',
			},
			{
				property: 'og:image:height',
				content: '630',
			},
			{
				property: 'og:image:alt',
				content: 'scores.frc.sh - FRC High Score Tracker',
			},
			// Twitter Card defaults
			{
				name: 'twitter:card',
				content: 'summary_large_image',
			},
			{
				name: 'twitter:image',
				content: `${SITE_URL}/twitter-image.png`,
			},
			{
				name: 'twitter:image:alt',
				content: 'scores.frc.sh - FRC High Score Tracker',
			},
		],
		links: [
			// Stylesheet
			{
				rel: 'stylesheet',
				href: appCss,
			},
			// Favicon and icons
			{
				rel: 'icon',
				type: 'image/x-icon',
				href: '/favicon.ico',
			},
			{
				rel: 'icon',
				type: 'image/svg+xml',
				href: '/icon.svg',
			},
			{
				rel: 'icon',
				type: 'image/png',
				href: '/icon.png',
			},
			{
				rel: 'apple-touch-icon',
				href: '/apple-icon.png',
			},
			// PWA manifest
			{
				rel: 'manifest',
				href: '/manifest.webmanifest',
			},
		],
	}),

	shellComponent: RootDocument,
	component: RootLayout,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className="min-h-screen">
				{children}
				<TanStackDevtools
					config={{
						position: 'bottom-right',
					}}
					plugins={[
						{
							name: 'Tanstack Router',
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}

function RootLayout() {
	const getSystemTheme = createIsomorphicFn()
		.server(() => 'light' as const)
		.client(() => {
			return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		});

	const handleThemeChange = createClientOnlyFn(() => {
		const root = document.documentElement;
		root.classList.remove('dark');

		const systemTheme = getSystemTheme();
		root.classList.add(systemTheme);
	});

	const setupPreferredListener = createClientOnlyFn(() => {
		// Apply theme on initial load
		handleThemeChange();

		// Listen for theme changes
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handler = () => handleThemeChange();
		mediaQuery.addEventListener('change', handler);
		return () => mediaQuery.removeEventListener('change', handler);
	});

	useEffect(() => setupPreferredListener(), [setupPreferredListener]);

	// Initialize Plausible analytics (auto-tracks pageviews in SPA)
	useEffect(() => {
		initPlausible();
	}, []);

	return (
		<>
			<ScriptOnce>{themeScript}</ScriptOnce>
			<div className="container mx-auto max-w-5xl">
				<div className="flex flex-col gap-1 justify-start items-center min-h-screen p-4">
					<Header />

					<main className="w-full">
						<Outlet />
					</main>

					<Footer />
				</div>
			</div>
		</>
	);
}
