import type { ReferenceType } from "@floating-ui/react";

import {
	Box,
	ButtonGroup,
	IconButton,
	Input,
	InputGroup,
	InputRightAddon,
	useToken,
} from "@chakra-ui/react";
import { $isSentenceNode } from "@components/Editor/nodes/Sentence/SentenceNode";
import FloatingContainer from "@components/Editor/ui/FloatingContainer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import useEditorSettingsStore from "@store/store";
import { $getNodeByKey } from "lexical";
import type { KeyboardEventHandler } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { RiEditLine, RiSaveLine } from "react-icons/ri";

type SentenceMenuPluginProps = {
	anchorElem: HTMLElement;
};

const SentenceMenuPlugin = ({ anchorElem }: SentenceMenuPluginProps) => {
	const [editor] = useLexicalComposerContext();
	const [sourceEditorVisible, setSourceEditorVisible] = useState(false);
	const [translationVisible, setTranslationVisible] = useState(false);
	const [translationInput, setTranslationInput] = useState("");
	const [popupWidth, setPopupWidth] = useState("");
	const [popupReference, setPopupReference] = useState<ReferenceType | null>(
		null
	);
	const [text400, text100] = useToken("colors", ["text.400", "text.100"]);

	const selectedWord = useEditorSettingsStore(
		(state) => state.editorSelectedBlock.word
	);
	const selectedSentenceKey = useEditorSettingsStore(
		(state) => state.editorSelectedBlock.sentenceKey
	);

	const translation = useMemo(() => {
		if (selectedSentenceKey) {
			return editor.getEditorState().read(() => {
				const node = $getNodeByKey(selectedSentenceKey);
				if (node && $isSentenceNode(node)) {
					return node.getTranslation();
				}
			});
		}
	}, [editor, selectedSentenceKey]);

	const updateTranslation = useCallback(() => {
		if (selectedSentenceKey && translation !== translationInput) {
			editor.update(() => {
				const sentenceNode = $getNodeByKey(selectedSentenceKey);
				if (!sentenceNode) return;

				if ($isSentenceNode(sentenceNode)) {
					sentenceNode.setTranslation(translationInput);
				}
			});
		}
	}, [translation, translationInput, editor, selectedSentenceKey]);

	const toggleTranslationVisible = useCallback(() => {
		if (selectedSentenceKey) {
			editor.update(() => {
				const sentenceNode = $getNodeByKey(selectedSentenceKey);
				if (!sentenceNode) return;

				if ($isSentenceNode(sentenceNode)) {
					sentenceNode.setShowTranslation(!translationVisible);
					setTranslationVisible(!translationVisible);
				}
			});
		}
	}, [editor, selectedSentenceKey, translationVisible]);

	const toggleEditor = useCallback(() => {
		setSourceEditorVisible((isVisible) => !isVisible);
		updateTranslation();
	}, [updateTranslation]);

	useEffect(() => {
		if (selectedSentenceKey) {
			editor.getEditorState().read(() => {
				const node = $getNodeByKey(selectedSentenceKey);
				if (node && $isSentenceNode(node)) {
					setTranslationInput(node.getTranslation());
					setTranslationVisible(node.getShowTranslation());
				} else {
					setSourceEditorVisible(false);
				}

				const isWordNode = selectedWord !== null;
				const element = editor.getElementByKey(selectedSentenceKey);
				if (element && !isWordNode) {
					setPopupReference(element);
					const elementBB = element.getBoundingClientRect();
					setPopupWidth(`${elementBB.width - 40}px`);
				} else {
					setPopupReference(null);
				}
			});
		} else {
			setPopupReference(null);
			setSourceEditorVisible(false);
		}
	}, [editor, selectedSentenceKey, selectedWord]);

	const handleKeyDown: KeyboardEventHandler = (event) => {
		switch (event.key) {
			case "Enter":
				event.preventDefault();
				setSourceEditorVisible((isVisible) => !isVisible);
				updateTranslation();
		}
	};

	const iconSize = "18px";
	return createPortal(
		<FloatingContainer
			popupReference={popupReference}
			popupPlacement="bottom"
			positionInline={false}
			popupOffset={2}
		>
			{sourceEditorVisible && (
				<InputGroup size="sm">
					<Input
						size="sm"
						autoFocus
						minW="200px"
						w={popupWidth}
						value={translationInput}
						onChange={(e) => setTranslationInput(e.target.value)}
						onKeyDown={handleKeyDown}
						focusBorderColor="text.100"
					/>
					<InputRightAddon p={1}>
						<IconButton
							borderRadius={0}
							size="sm"
							icon={
								<RiSaveLine
									color={text400}
									style={{
										height: iconSize,
										width: iconSize,
									}}
								/>
							}
							aria-label="Bold"
							variant="link"
							onClick={toggleEditor}
						/>
					</InputRightAddon>
				</InputGroup>
			)}
			{!sourceEditorVisible && (
				<Box pos="relative" zIndex={50} display="flex">
					<ButtonGroup
						size="sm"
						isAttached
						variant="outline"
						sx={{
							"&>button": {
								height: "35px",
								minWidth: "40px",
							},
						}}
					>
						<IconButton
							icon={
								!translationVisible ? (
									<IoEye
										color={text400}
										style={{
											height: iconSize,
											width: iconSize,
										}}
									/>
								) : (
									<IoEyeOff
										color={text400}
										style={{
											height: iconSize,
											width: iconSize,
										}}
									/>
								)
							}
							aria-label="Bold"
							variant="ghost"
							onClick={toggleTranslationVisible}
						/>
						<IconButton
							borderRadius={0}
							bg={sourceEditorVisible ? text100 : "inherit"}
							icon={
								<RiEditLine
									color={text400}
									style={{
										height: iconSize,
										width: iconSize,
									}}
								/>
							}
							aria-label="Bold"
							variant="ghost"
							onClick={toggleEditor}
						/>
					</ButtonGroup>
				</Box>
			)}
		</FloatingContainer>,
		anchorElem
	);
};

export default SentenceMenuPlugin;
