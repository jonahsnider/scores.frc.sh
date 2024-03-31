import { DotFilledIcon } from '@radix-ui/react-icons';
import { Heading, Link } from '@radix-ui/themes';

export function Footer() {
	return (
		// Should stick to bottom
		<footer className='flex flex-col gap-1 pt-8 sm:pt-12 justify-center w-full items-center text-center'>
			<Heading size={{ initial: '3', xs: '4' }}>Other projects</Heading>

			<div className='flex gap-2 justify-center items-center'>
				<Link href='https://frc.sh/?utm_source=scores.frc.sh' size='3'>
					frc.sh
				</Link>

				<DotFilledIcon />

				<Link href='https://frc-colors.com/?utm_source=scores.frc.sh' size='3'>
					FRC Colors
				</Link>
			</div>
		</footer>
	);
}
