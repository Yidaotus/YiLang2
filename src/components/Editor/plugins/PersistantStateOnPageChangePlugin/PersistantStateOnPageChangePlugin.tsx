import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_NORMAL, createCommand } from "lexical";
import { useRouter } from "next/router";
import { useCallback, useEffect } from "react";
import { SAVE_EDITOR } from "../SaveToDBPlugin/SaveToDBPlugin";

export const NAVIGATE_PAGE_COMMAND = createCommand<{ url: string }>(
	"NAVIGATE_PAGE_COMMAND"
);

const PersistStateOnPageChangePlugion = () => {
	const [editor] = useLexicalComposerContext();
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
			router.push(url);
		},
		[editor, router]
	);

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
