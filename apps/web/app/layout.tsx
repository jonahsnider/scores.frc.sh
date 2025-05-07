import { Container, Theme } from '@radix-ui/themes';
import { Analytics } from '@vercel/analytics/react';
import type { Metadata, Viewport } from 'next';
import PlausibleProvider from 'next-plausible';
import { ThemeProvider } from 'next-themes';
import { Footer } from './components/footer';
import { Header } from './components/header';

import './globals.css';
import { QueryProvider } from './api/query-provider';
import { metadataBase } from './metadata';

export const metadata: Metadata = {
	title: { absolute: 'scores.frc.sh', template: '%s | scores.frc.sh' },
	description: 'View the progression of the world record & event high scores for FRC.',
	metadataBase,
	openGraph: {
		url: 'https://scores.frc.sh',
		type: 'website',
		title: 'scores.frc.sh',
		siteName: 'scores.frc.sh',
	},
};

export const viewport: Viewport = {
	themeColor: [
		{
			media: '(prefers-color-scheme: dark)',
			color: '#101211',
		},
		{
			media: '(prefers-color-scheme: light)',
			color: '#ffffff',
		},
	],
	colorScheme: 'dark light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang='en' suppressHydrationWarning={true}>
			<head>
				<PlausibleProvider domain='scores.frc.sh' />
			</head>
			<body>
				<ThemeProvider enableSystem={true} attribute='class'>
					<Theme accentColor='jade' grayColor='sage' scaling='110%'>
						<Container p='4'>
							<QueryProvider>
								<div className='flex flex-col gap-1 justify-start items-center'>
									<Header />

									<main className='w-full'>{children}</main>

									<Footer />
								</div>
							</QueryProvider>
						</Container>
					</Theme>
				</ThemeProvider>

				<Analytics />
			</body>
		</html>
	);
}
