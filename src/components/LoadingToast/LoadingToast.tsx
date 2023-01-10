import type { UseToastOptions } from "@chakra-ui/react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

import {
	Alert,
	AlertDescription,
	AlertTitle,
	chakra,
	Spinner,
	useToast,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

type LoadingToastProps = {
	title?: ReactNode;
	description?: ReactNode;
	id?: string | number;
};

const ToastAsync = ({
	title = "Loading...",
	description,
	id,
}: LoadingToastProps) => (
	<Alert
		status="info"
		variant="left-accent"
		id={id?.toString()}
		alignItems="start"
		borderRadius="md"
		boxShadow="lg"
		paddingEnd={8}
		textAlign="start"
		width="auto"
	>
		<Spinner marginRight="4" />
		<chakra.div flex="1">
			<AlertTitle>{title}</AlertTitle>
			{description && (
				<AlertDescription display="block">{description}</AlertDescription>
			)}
		</chakra.div>
	</Alert>
);

const MIN_DELAY = 2000;

const useLoadingToast = (
	loading?: boolean,
	toastOptions?: UseToastOptions
): [boolean, Dispatch<SetStateAction<boolean>>] => {
	const toast = useToast();
	const toastRef = useRef<string | number | null>(null);
	const delayRef = useRef<number>(0);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [isLoading, setLoading] = useState<boolean>(loading ?? false);

	useEffect(() => {
		if (isLoading) {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}
			if (toastRef.current) {
				return;
			}
			toastRef.current = toast({
				render: () => <ToastAsync {...toastOptions} />,
				...toastOptions,
			});
			delayRef.current = Date.now();
		} else if (toastRef.current) {
			const delta = Date.now() - delayRef.current;
			console.debug({ delta });
			if (delta >= MIN_DELAY) {
				toast.close(toastRef.current);
				toastRef.current = null;
			} else {
				timerRef.current = setTimeout(() => {
					if (toastRef.current) {
						toast.close(toastRef.current);
						toastRef.current = null;
					}
				}, MIN_DELAY - delta);
			}
		}
	}, [isLoading, toast, toastOptions]);

	return [isLoading, setLoading];
};

export default useLoadingToast;
