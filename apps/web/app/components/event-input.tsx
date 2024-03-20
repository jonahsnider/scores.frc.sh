import { TextInput } from '@tremor/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Props = {
	onValueChange: (value: string | undefined) => void;
};

export function EventInput({ onValueChange }: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [eventCode, setEventCodeRaw] = useState<string | undefined>(searchParams.get('eventCode') ?? undefined);

	const setEventCode = (value: string) => setEventCodeRaw(value === '' ? undefined : value.toUpperCase());

	useEffect(() => {
		const url = new URL(window.location.href);

		if (eventCode) {
			url.searchParams.set('eventCode', eventCode);
		} else {
			url.searchParams.delete('eventCode');
		}

		router.replace(url.href);
	}, [eventCode, router]);

	useEffect(() => {
		onValueChange(eventCode);
	}, [eventCode, onValueChange]);

	return (
		<TextInput
			type='text'
			placeholder='Event code (optional)'
			value={eventCode ?? ''}
			onValueChange={(value) => setEventCode(value)}
		/>
	);
}
