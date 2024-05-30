export const metadataBase = new URL(
	process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://scores.frc.sh',
);
