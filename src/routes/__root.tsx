import { TanStackDevtools } from '@tanstack/react-devtools';
import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, Outlet, ScriptOnce, Scripts } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { createClientOnlyFn, createIsomorphicFn } from '@tanstack/react-start';
import { useEffect } from 'react';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
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
			{
				charSet: 'utf-8',
			},
			{
				name: 'viewport',
				content: 'width=device-width, initial-scale=1',
			},
			{
				title: 'scores.frc.sh',
			},
			{
				name: 'description',
				content: 'View the progression of the world record & event high scores for FRC.',
			},
		],
		links: [
			{
				rel: 'stylesheet',
				href: appCss,
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
