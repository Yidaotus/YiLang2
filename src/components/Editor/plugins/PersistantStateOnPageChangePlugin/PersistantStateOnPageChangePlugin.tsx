import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_NORMAL, createCommand } from "lexical";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef } from "react";
import { SAVE_EDITOR } from "../SaveToDBPlugin/SaveToDBPlugin";

export const NAVIGATE_PAGE_COMMAND = createCommand<{ url: string }>(
	"NAVIGATE_PAGE_COMMAND"
);

const PersistStateOnPageChangePlugion = () => {
	const [editor] = useLexicalComposerContext();
	const shouldInterruptRouteChange = useRef(true);
	const router = useRouter();

	const handleRouteChange = useCallback(
		async (url: string) => {
			const notifyWhenDone = new Promise<void>((resolve) => {
				editor.dispatchCommand(SAVE_EDITOR, {
					shouldShowToast: true,
					notifyWhenDone: resolve,
				});
			});
			await notifyWhenDone;
			shouldInterruptRouteChange.current = false;
			router.push(url);
		},
		[editor, router]
	);

	const interruptRouteChange = useCallback(
		(url: string) => {
			if (shouldInterruptRouteChange.current) {
				handleRouteChange(url);
				throw Error("stop redirect since form is dirty");
			}
		},
		[handleRouteChange]
	);

	const silentRouteError = useCallback(() => {
		console.debug("All good!");
	}, []);

	const resetInterruptRef = useCallback(() => {
		shouldInterruptRouteChange.current = true;
	}, []);

	useEffect(() => {
		router.events.on("routeChangeStart", interruptRouteChange);
		router.events.on("routeChangeComplete", resetInterruptRef);
		router.events.on("routeChangeError", silentRouteError);
		return () => {
			router.events.off("routeChangeStart", interruptRouteChange);
			router.events.off("routeChangeComplete", resetInterruptRef);
			router.events.off("routeChangeError", silentRouteError);
		};
	}, [
		handleRouteChange,
		interruptRouteChange,
		resetInterruptRef,
		router.events,
		silentRouteError,
	]);

	useEffect(() => {
		return editor.registerCommand(
			NAVIGATE_PAGE_COMMAND,
			({ url }) => {
				handleRouteChange(url);
				return true;
			},
			COMMAND_PRIORITY_NORMAL
		);
	}, [editor, handleRouteChange, router]);

	return null;
};

export default PersistStateOnPageChangePlugion;
