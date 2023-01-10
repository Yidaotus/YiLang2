import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection } from "lexical";
import { useCallback, useEffect } from "react";

type BlockSelectPopupPluginProps = {
	anchorElem: HTMLElement | null;
};

const BlockSelectPopupPlugin = ({
	anchorElem,
}: BlockSelectPopupPluginProps) => {
	const [editor] = useLexicalComposerContext();

	const showBlockSelector = useCallback(() => {
		console.debug("Show block selector!");
	}, []);

	const checkForEmptyBlock = useCallback(() => {
		const selection = $getSelection();
		if (!selection) return;

		const nodes = selection.getNodes();
		const targetNode = nodes[0];
		if (nodes.length !== 1 || !targetNode) return;

		const targetParent = targetNode.getParent();
		if (!targetParent) return;

		const textContent = targetParent.getTextContent();
		if (textContent === "/") {
			showBlockSelector();
		}
	}, [showBlockSelector]);

	useEffect(() => {
		editor.getEditorState().read(() => {
			checkForEmptyBlock();
		});
		return editor.registerUpdateListener(({ editorState }) => {
			editorState.read(() => {
				checkForEmptyBlock();
			});
		});
	}, [editor, checkForEmptyBlock]);

	return null;
};

export default BlockSelectPopupPlugin;
