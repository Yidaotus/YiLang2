import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import useEditorStore from "@store/store";
import { trpc } from "@utils/trpc";
import { $getRoot } from "lexical";
import { $isHeadingNode } from "@lexical/rich-text";
import { useCallback, useEffect } from "react";

const SaveOnBlurPlugin = ({ documentId }: { documentId: string }) => {
	const [editor] = useLexicalComposerContext();
	const upsertDocument = trpc.document.upsertDocument.useMutation();
	const selectedLanguage = useEditorStore((store) => store.selectedLanguage);

	const saveOnBlurHandler = useCallback(() => {
		const serializedState = JSON.stringify(editor.getEditorState());
		editor.getEditorState().read(() => {
			const root = $getRoot();
			const rootElements = root.getChildren();
			let title = "";
			for (const node of rootElements) {
				if ($isHeadingNode(node)) {
					title = node.getTextContent();
					break;
				}
			}
			upsertDocument.mutate({
				id: documentId,
				title,
				serializedDocument: serializedState,
				language: selectedLanguage.id,
			});
		});
	}, [documentId, editor, selectedLanguage, upsertDocument]);

	useEffect(() => {
		window.addEventListener("blur", saveOnBlurHandler);
		return () => {
			window.removeEventListener("blur", saveOnBlurHandler);
		};
	}, [saveOnBlurHandler]);

	return null;
};

export default SaveOnBlurPlugin;
