import { Heading, Link, Text } from '@radix-ui/themes';

export function Header() {
	return (
		<header className='w-full flex flex-col gap-1 justify-center items-center'>
			<Heading size={{ initial: '7', xs: '8' }}>scores.frc.sh</Heading>

			<Text size={{ initial: '3', xs: '4' }}>
				Created by <Link href='https://jonahsnider.com'>Jonah Snider</Link>
			</Text>

			<Text size={{ initial: '3', xs: '4' }}>
				View source on <Link href='https://github.com/jonahsnider/scores.frc.sh'>GitHub</Link>
			</Text>
		</header>
	);
}
