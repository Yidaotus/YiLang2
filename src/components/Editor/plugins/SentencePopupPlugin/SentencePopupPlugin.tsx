import type { ReferenceType } from "@floating-ui/react";

import {
	Box,
	IconButton,
	Input,
	InputGroup,
	InputRightElement,
	Text,
} from "@chakra-ui/react";
import { $isSentenceNode } from "@components/Editor/nodes/Sentence/SentenceNode";
import { $isSentenceToggleNode } from "@components/Editor/nodes/Sentence/SentenceToggleNode";
import FloatingContainer from "@components/Editor/ui/FloatingContainer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
	$getNearestNodeFromDOMNode,
	$getSelection,
	$isNodeSelection,
	COMMAND_PRIORITY_LOW,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RiEditFill, RiSaveFill } from "react-icons/ri";

const SentencePopupPlugin = ({ anchorElem }: { anchorElem: HTMLElement }) => {
	const [translation, setTranslation] = useState<string | null>(null);
	const [editor] = useLexicalComposerContext();

	const [popupReference, setPopupReference] = useState<ReferenceType | null>(
		null
	);
	const [minWidth, setMinWidth] = useState(0);
	const [isEditing, setIsEditing] = useState(false);
	const [translationInput, setTranslationInput] = useState("");

	const saveEdit = useCallback(() => {
		if (translationInput !== translation) {
			editor.update(() => {
				const node = $getNearestNodeFromDOMNode(popupReference as HTMLElement);
				if (!$isSentenceNode(node)) return;

				node.setTranslation(translationInput);
			});
		}
		setIsEditing(false);
	}, [editor, popupReference, translation, translationInput]);

	const updatePopup = useCallback(() => {
		const selection = $getSelection();

		if (!$isNodeSelection(selection)) {
			setPopupReference(null);
			setIsEditing(false);
			return;
		}

		const node = selection.getNodes();
		if (node.length < 1) return;

		const target = node[0];
		if (!$isSentenceToggleNode(target)) return;

		const parent = target.getParent();
		if (!$isSentenceNode(parent)) return;

		setTranslation(parent.getTranslation());
		const domPos = editor.getElementByKey(parent.getKey());

		if (!domPos) return;
		setPopupReference(domPos);
		setMinWidth(domPos.clientWidth);
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

	const setEditing = useCallback(() => {
		setIsEditing(true);
		setTranslationInput(translation || "");
	}, [translation]);

	return createPortal(
		<FloatingContainer
			popupOffset={0}
			popupReference={popupReference}
			popupPlacement="bottom"
			w={`${minWidth}px`}
			mx={[2, null, 0]}
			stretchOnMobile
		>
			<Box
				px={isEditing ? 1 : 2}
				py={isEditing ? 1 : 2}
				display="flex"
				justifyContent="space-between"
				alignItems="center"
			>
				{isEditing && (
					<InputGroup size="sm">
						<Input
							fontSize="1em"
							size="sm"
							value={translationInput}
							onChange={(e) => setTranslationInput(e.target.value)}
							autoFocus
						/>
						<InputRightElement>
							<IconButton
								icon={<RiSaveFill height="100%" />}
								size="sm"
								variant="link"
								aria-label="save sentence"
								onClick={saveEdit}
							/>
						</InputRightElement>
					</InputGroup>
				)}
				{!isEditing && (
					<>
						<Text>{translation}</Text>
						<IconButton
							icon={<RiEditFill />}
							size="sm"
							variant="link"
							onClick={setEditing}
							aria-label="edit sentence"
						/>
					</>
				)}
			</Box>
		</FloatingContainer>,
		anchorElem
	);
};

export default SentencePopupPlugin;
