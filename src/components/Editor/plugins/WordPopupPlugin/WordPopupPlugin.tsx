import type { ReferenceType } from "@floating-ui/react";

import { $isWordNode } from "@components/Editor/nodes/WordNode";

import { mergeRegister } from "@lexical/utils";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import {
	$getSelection,
	$isNodeSelection,
	SELECTION_CHANGE_COMMAND,
	COMMAND_PRIORITY_LOW,
} from "lexical";
import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import FloatingContainer from "@components/Editor/ui/FloatingContainer";
import Word from "@components/Word";
import { Box } from "@chakra-ui/react";

const WordPopupPlugin = ({ anchorElem }: { anchorElem: HTMLElement }) => {
	const [wordNode, setWordNode] = useState<{
		id?: string;
		word: string;
		translations: Array<string>;
	} | null>(null);
	const [editor] = useLexicalComposerContext();

	const [popupReference, setPopupReference] = useState<ReferenceType | null>(
		null
	);

	const updatePopup = useCallback(() => {
		const selection = $getSelection();

		if (!$isNodeSelection(selection)) {
			setPopupReference(null);
			return;
		}

		const node = selection.getNodes();
		if (node.length < 1) return;

		const target = node[0];
		if (!$isWordNode(target)) return;

		setWordNode({
			id: target.getId(),
			word: target.getWord(),
			translations: target.getTranslations(),
		});
		const domPos = editor.getElementByKey(target.getKey());

		if (!domPos) return;
		setPopupReference(domPos);
	}, [editor]);

	useEffect(() => {
		document.addEventListener("resize", updatePopup);
		return () => document.removeEventListener("resize", updatePopup);
	}, [updatePopup]);

	useEffect(() => {
		return mergeRegister(
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					updatePopup();
					return false;
				},
				COMMAND_PRIORITY_LOW
			),
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(() => {
					updatePopup();
				});
			})
		);
	}, [editor, updatePopup]);

	return createPortal(
		<FloatingContainer
			popupReference={popupReference}
			popupPlacement="bottom"
			minW={["unset", null, "150px"]}
			maxW={["unset", null, "400px"]}
			mx={[2, null, 0]}
		>
			<Box>{wordNode?.id && <Word wordId={wordNode.id} />}</Box>
		</FloatingContainer>,
		anchorElem
	);
};

export default WordPopupPlugin;
