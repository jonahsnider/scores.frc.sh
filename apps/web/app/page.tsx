'use client';

import { useState } from 'react';
import { ScoreChart } from './components/score-chart';

// biome-ignore lint/style/noDefaultExport: This has to be a default export
export default function HomePage() {
	const [year, _setYear] = useState(new Date().getFullYear());

	return (
		<div>
			hi
			<ScoreChart year={year} />
		</div>
	);
}
