import { Container, Theme } from '@radix-ui/themes';
import { Analytics } from '@vercel/analytics/react';
import type { Metadata, Viewport } from 'next';
import PlausibleProvider from 'next-plausible';
import { ThemeProvider } from 'next-themes';
import { Footer } from './components/footer';
import { Header } from './components/header';
import { TrpcProvider } from './components/trpc/trpc-provider';

import './globals.css';
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
		description: 'View the progression of the world record & event high scores for FRC.',
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

// biome-ignore lint/style/noDefaultExport: This has to be a default export
export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang='en'>
			<head>
				<PlausibleProvider domain='scores.frc.sh' />
			</head>
			<body>
				<ThemeProvider enableSystem={true} attribute='class'>
					<Theme accentColor='jade' grayColor='sage' scaling='110%'>
						<Container p='4'>
							<TrpcProvider>
								<div className='flex flex-col gap-1 justify-start items-center'>
									<Header />

									<main className='w-full'>{children}</main>

									<Footer />
								</div>
							</TrpcProvider>
						</Container>
					</Theme>
				</ThemeProvider>

				<Analytics />
			</body>
		</html>
	);
}
