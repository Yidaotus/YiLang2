import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import useEditorStore from "@store/store";
import { trpc } from "@utils/trpc";
import { $getRoot } from "lexical";
import { $isHeadingNode } from "@lexical/rich-text";
import { useRouter } from "next/router";
import { useCallback, useEffect } from "react";

const PersistStateOnPageChangePlugion = ({
	documentId,
}: {
	documentId: string;
}) => {
	const [editor] = useLexicalComposerContext();
	const editorState = useEditorStore((state) => state.editorState);
	const upsertDocument = trpc.document.upsertDocument.useMutation();
	// probably pull out to Editor it self and prop drill?
	const selectedLanguage = useEditorStore((store) => store.selectedLanguage);
	const setEditorState = useEditorStore((state) => state.setEditorState);
	const router = useRouter();

	useEffect(() => {
		if (editorState) {
			const savedEditorState = editor.parseEditorState(editorState);
			//editor.setEditorState(savedEditorState);
		}
	}, [documentId, editor, editorState]);

	const handleRouteChange = useCallback(() => {
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
		router.events.on("routeChangeStart", handleRouteChange);
		return () => {
			router.events.off("routeChangeStart", handleRouteChange);
		};
	}, [handleRouteChange, router]);

	return null;
};

export default PersistStateOnPageChangePlugion;
