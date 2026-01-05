export function Footer() {
	return (
		<footer className="flex flex-col gap-1 pt-8 sm:pt-12 justify-center w-full items-center text-center">
			<h2 className="text-base sm:text-lg font-semibold text-foreground">Other projects</h2>

			<div className="flex gap-2 justify-center items-center text-sm sm:text-base">
				<a
					href="https://frc.sh/?utm_source=scores.frc.sh"
					className="text-primary hover:underline"
					target="_blank"
					rel="noopener noreferrer"
				>
					frc.sh
				</a>

				<span className="text-muted-foreground/50">•</span>

				<a
					href="https://frc-colors.com/?utm_source=scores.frc.sh"
					className="text-primary hover:underline"
					target="_blank"
					rel="noopener noreferrer"
				>
					FRC Colors
				</a>
			</div>
		</footer>
	);
}
