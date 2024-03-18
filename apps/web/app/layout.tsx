import { Analytics } from '@vercel/analytics/react';
import clsx from 'clsx';
import type { Metadata } from 'next';
import PlausibleProvider from 'next-plausible';
import { Fira_Mono, Inter } from 'next/font/google';
import { TrpcProvider } from './components/trpc/trpc-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });
const firaMono = Fira_Mono({ weight: ['400'], subsets: ['latin'], variable: '--font-fira-mono' });

export const metadata: Metadata = {
	title: 'scores.frc.sh',
	description: 'View the progression of the world record high scores for FRC.',
	metadataBase: new URL('https://scores.frc.sh'),
	openGraph: {
		url: 'https://scores.frc.sh',
		type: 'website',
		title: 'scores.frc.sh',
		siteName: 'scores.frc.sh',
		description: 'View the progression of the world record high scores for FRC.',
	},
};

// biome-ignore lint/style/noDefaultExport: This has to be a default export
export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang='en'>
			<head>
				<PlausibleProvider domain='scores.frc.sh' />
			</head>
			<body
				className={clsx('container mx-auto bg-neutral-900 dark p-4 text-white', inter.className, firaMono.variable)}
			>
				<TrpcProvider>{children}</TrpcProvider>

				<Analytics />
			</body>
		</html>
	);
}
