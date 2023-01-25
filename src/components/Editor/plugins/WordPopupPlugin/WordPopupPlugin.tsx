import type { ReferenceType } from "@floating-ui/react";

import { Box } from "@chakra-ui/react";
import FloatingContainer from "@components/Editor/ui/FloatingContainer";
import Word from "@components/Word";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import useEditorSettingsStore from "@store/store";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NAVIGATE_PAGE_COMMAND } from "../PersistantStateOnPageChangePlugin/PersistantStateOnPageChangePlugin";

const WordPopupPlugin = ({ anchorElem }: { anchorElem: HTMLElement }) => {
	const [wordId, setWordId] = useState<string | null>(null);
	const [editor] = useLexicalComposerContext();
	const selectedWord = useEditorSettingsStore(
		(state) => state.editorSelectedBlock.word
	);

	const [popupReference, setPopupReference] = useState<ReferenceType | null>(
		null
	);

	const editWord = useCallback(
		(id: string) => {
			/* @TODO Infers with router change event hook
			const currentQuery = router.query;
			router.push({ query: { ...currentQuery, highlight: id } }, undefined, {
				shallow: true,
			});
			*/
			editor.dispatchCommand(NAVIGATE_PAGE_COMMAND, {
				url: `/app/dictionary/${id}`,
			});
		},
		[editor]
	);

	const updatePopup = useCallback(() => {
		if (!selectedWord) {
			setPopupReference(null);
		} else {
			setWordId(selectedWord.id);
			const domPos = editor.getElementByKey(selectedWord.key);

			if (!domPos) return;
			setPopupReference(domPos);
		}
	}, [editor, selectedWord]);

	useEffect(() => {
		document.addEventListener("resize", updatePopup);
		return () => document.removeEventListener("resize", updatePopup);
	}, [updatePopup]);

	useEffect(() => {
		updatePopup();
	}, [selectedWord, updatePopup]);

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
				{wordId && (
					<Word
						databaseId={wordId}
						clickHandler={({ databaseId: id }) => editWord(id)}
					/>
				)}
			</Box>
		</FloatingContainer>,
		anchorElem
	);
};

export default WordPopupPlugin;
