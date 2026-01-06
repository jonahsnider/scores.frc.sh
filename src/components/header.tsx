import { Link } from '@tanstack/react-router';

export function Header() {
	return (
		<header className="w-full flex flex-col justify-center items-center pb-4 sm:pb-6 md:pb-8">
			<Link to="/" className="text-foreground hover:text-foreground/80 transition-colors">
				<h1 className="text-3xl sm:text-4xl font-bold tracking-tight pb-2">scores.frc.sh</h1>
			</Link>

			<div className="flex flex-col sm:flex-row gap-1 justify-center items-center text-muted-foreground">
				<span className="text-sm sm:text-base">
					Created by{' '}
					<a
						href="https://jonahsnider.com"
						className="text-primary hover:underline"
						target="_blank"
						rel="noopener noreferrer"
					>
						Jonah Snider
					</a>
				</span>

				<span className="hidden sm:inline text-muted-foreground/50">•</span>

				<span className="text-sm sm:text-base">
					View source on{' '}
					<a
						href="https://github.com/jonahsnider/scores.frc.sh"
						className="text-primary hover:underline"
						target="_blank"
						rel="noopener noreferrer"
					>
						GitHub
					</a>
				</span>
			</div>
		</header>
	);
}
