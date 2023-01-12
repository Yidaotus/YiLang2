import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useRouter } from "next/router";
import { useCallback, useEffect } from "react";
import { SAVE_EDITOR } from "../SaveToDBPlugin/SaveToDBPlugin";

const PersistStateOnPageChangePlugion = () => {
	const [editor] = useLexicalComposerContext();
	const router = useRouter();

	const handleRouteChange = useCallback(() => {
		editor.dispatchCommand(SAVE_EDITOR, undefined);
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
