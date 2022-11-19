import { useEffect } from "react";

type Handler = (event: MouseEvent | TouchEvent) => void;
function useOnClickOutside<T extends HTMLElement = HTMLElement>(
	ref: React.RefObject<T>,
	handler: Handler
): void {
	useEffect(() => {
		const listener = (event: MouseEvent | TouchEvent) => {
			const el = ref?.current;
			if (!el || el.contains(event.target as Node)) {
				return;
			}
			handler(event);
		};
		document.addEventListener("mousedown", listener);
		document.addEventListener("touchstart", listener);
		return () => {
			document.removeEventListener("mousedown", listener);
			document.removeEventListener("touchstart", listener);
		};
	}, [ref, handler]);
}

export default useOnClickOutside;
