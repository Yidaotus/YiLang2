import type { ReferenceType } from "@floating-ui/react";

import {
	Box,
	ButtonGroup,
	IconButton,
	Input,
	useToken,
} from "@chakra-ui/react";
import { $isSentenceNode } from "@components/Editor/nodes/Sentence/SentenceNode";
import FloatingContainer from "@components/Editor/ui/FloatingContainer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import useEditorStore from "@store/store";
import { $getNodeByKey } from "lexical";
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
	const [popupReference, setPopupReference] = useState<ReferenceType | null>(
		null
	);
	const [text400, text100] = useToken("colors", ["text.400", "text.100"]);

	const selectedSentenceKey = useEditorStore(
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

				const element = editor.getElementByKey(selectedSentenceKey);
				if (element) {
					setPopupReference(element);
				} else {
					setPopupReference(null);
				}
			});
		} else {
			setPopupReference(null);
			setSourceEditorVisible(false);
		}
	}, [editor, selectedSentenceKey]);

	const iconSize = "18px";
	return createPortal(
		<>
			{sourceEditorVisible && (
				<FloatingContainer
					popupReference={popupReference}
					popupPlacement="bottom"
					popupOffset={2}
				>
					<Box>
						<Input
							size="md"
							autoFocus
							w="100%"
							value={translationInput}
							onChange={(e) => setTranslationInput(e.target.value)}
						/>
					</Box>
				</FloatingContainer>
			)}
			<FloatingContainer
				popupReference={popupReference}
				popupPlacement="top"
				showArrow
				popupOffset={10}
			>
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
								translationVisible ? (
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
								sourceEditorVisible ? (
									<RiSaveLine
										color={text400}
										style={{
											height: iconSize,
											width: iconSize,
										}}
									/>
								) : (
									<RiEditLine
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
							onClick={toggleEditor}
						/>
					</ButtonGroup>
				</Box>
			</FloatingContainer>
		</>,
		anchorElem
	);
};

export default SentenceMenuPlugin;
