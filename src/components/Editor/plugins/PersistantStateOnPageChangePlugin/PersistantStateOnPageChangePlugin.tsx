import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useRouter } from "next/router";
import { useCallback, useEffect } from "react";
import { RECONCILE_AND_SAVE_EDITOR } from "../IndexElementsPlugin/IndexElementsPlugin";

const PersistStateOnPageChangePlugion = () => {
	const [editor] = useLexicalComposerContext();
	const router = useRouter();

	const handleRouteChange = useCallback(async () => {
		const notifyWhenDone = new Promise<void>((resolve) => {
			editor.dispatchCommand(RECONCILE_AND_SAVE_EDITOR, {
				shouldShowToast: true,
			});
		});
	}, [editor]);

	useEffect(() => {
		router.events.on("routeChangeStart", handleRouteChange);
		return () => {
			router.events.off("routeChangeStart", handleRouteChange);
		};
	}, [handleRouteChange, router]);

	return null;
};

export default PersistStateOnPageChangePlugion;
