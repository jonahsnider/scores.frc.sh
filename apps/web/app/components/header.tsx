import { DotFilledIcon } from '@radix-ui/react-icons';
import { Heading, Link, Text } from '@radix-ui/themes';
import NextLink from 'next/link';

export function Header() {
	return (
		<header className='w-full flex flex-col justify-center items-center pb-4 sm:pb-6 md:pb-8'>
			<Link asChild={true} highContrast={true} color='gray' underline='hover'>
				<NextLink href='/'>
					<Heading size={{ initial: '7', xs: '8' }} className='pb-2'>
						scores.frc.sh
					</Heading>
				</NextLink>
			</Link>

			<div className='flex flex-col sm:flex-row gap-1 justify-center items-center'>
				<Text size={{ initial: '3', xs: '3' }}>
					Created by <Link href='https://jonahsnider.com'>Jonah Snider</Link>
				</Text>

				<DotFilledIcon className='max-sm:hidden' />

				<Text size={{ initial: '3', xs: '3' }}>
					View source on <Link href='https://github.com/jonahsnider/scores.frc.sh'>GitHub</Link>
				</Text>
			</div>
		</header>
	);
}
