import type { ReferenceType } from "@floating-ui/react";

import { Box } from "@chakra-ui/react";
import { $isWordNode } from "@components/Editor/nodes/WordNode";
import FloatingContainer from "@components/Editor/ui/FloatingContainer";
import Word from "@components/Word";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
	$getSelection,
	$isNodeSelection,
	COMMAND_PRIORITY_LOW,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NAVIGATE_PAGE_COMMAND } from "../PersistantStateOnPageChangePlugin/PersistantStateOnPageChangePlugin";

const WordPopupPlugin = ({ anchorElem }: { anchorElem: HTMLElement }) => {
	const [wordNode, setWordNode] = useState<{
		databaseId: string | null;
		word: string;
		translations: Array<string>;
	} | null>(null);
	const [editor] = useLexicalComposerContext();

	const [popupReference, setPopupReference] = useState<ReferenceType | null>(
		null
	);

	const editWord = useCallback(
		(id: string) => {
			editor.dispatchCommand(NAVIGATE_PAGE_COMMAND, {
				url: `/app/dictionary/${id}`,
			});
		},
		[editor]
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
			databaseId: target.getDatabaseId(),
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
			stretchOnMobile
			showArrow
		>
			<Box>
				{wordNode?.databaseId && (
					<Word
						databaseId={wordNode.databaseId}
						clickHandler={({ databaseId: id }) => editWord(id)}
					/>
				)}
			</Box>
		</FloatingContainer>,
		anchorElem
	);
};

export default WordPopupPlugin;
