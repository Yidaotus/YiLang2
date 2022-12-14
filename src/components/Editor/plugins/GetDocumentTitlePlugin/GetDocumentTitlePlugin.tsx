import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isHeadingNode } from "@lexical/rich-text";
import { $getRoot } from "lexical";
import { useCallback, useEffect } from "react";

const GetDocumentTitlePlugin = ({
	setDocumentTitle,
}: {
	setDocumentTitle: (title: string) => void;
}) => {
	const [editor] = useLexicalComposerContext();

	const getTitleFromDocument = useCallback(() => {
		editor.getEditorState().read(() => {
			const root = $getRoot();
			const rootElements = root.getChildren();
			for (const node of rootElements) {
				if ($isHeadingNode(node)) {
					setDocumentTitle(node.getTextContent());
					break;
				}
			}
		});
	}, [editor, setDocumentTitle]);

	useEffect(() => {
		return editor.registerUpdateListener(getTitleFromDocument);
	}, [editor, getTitleFromDocument]);

	return null;
};

export default GetDocumentTitlePlugin;
