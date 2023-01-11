import type { ReferenceType } from "@floating-ui/react";

import {
	Box,
	ButtonGroup,
	Divider,
	IconButton,
	Input,
	useToken,
} from "@chakra-ui/react";
import { $isImageNode } from "@components/Editor/nodes/ImageNode";
import FloatingContainer from "@components/Editor/ui/FloatingContainer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import useEditorStore from "@store/store";
import { $getNodeByKey, FORMAT_ELEMENT_COMMAND } from "lexical";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
	RiAlignCenter,
	RiAlignLeft,
	RiAlignRight,
	RiEditLine,
	RiSaveLine,
} from "react-icons/ri";
import shallow from "zustand/shallow";

type ImageMenuPluginProps = {
	anchorElem: HTMLElement;
};

const ImageMenuPlugin = ({ anchorElem }: ImageMenuPluginProps) => {
	const [editor] = useLexicalComposerContext();
	const [sourceEditorVisible, setSourceEditorVisible] = useState(false);
	const [imageSourceInput, setImageSourceInput] = useState("");
	const [popupReference, setPopupReference] = useState<ReferenceType | null>(
		null
	);
	const [text400, text100] = useToken("colors", ["text.400", "text.100"]);

	const selectedBlock = useEditorStore(
		(state) => state.editorSelectedBlock,
		shallow
	);

	const imageSource = useMemo(() => {
		if (selectedBlock.type === "image") {
			return editor.getEditorState().read(() => {
				const node = $getNodeByKey(selectedBlock.key);
				if (node && $isImageNode(node)) {
					return node.getSrc();
				}
			});
		}
	}, [editor, selectedBlock]);

	const updateImageSource = useCallback(() => {
		const httpRegex =
			/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
		if (imageSource !== imageSourceInput && httpRegex.test(imageSourceInput)) {
			editor.update(() => {
				const imgNode = $getNodeByKey(selectedBlock.key);
				if (!imgNode) return;

				if ($isImageNode(imgNode)) {
					imgNode.setSrc(imageSourceInput);
					imgNode.setIsUploaded(false);
				}
			});
		} else {
			setImageSourceInput(imageSource || "");
		}
	}, [editor, imageSource, imageSourceInput, selectedBlock.key]);

	const toggleSourceEditor = useCallback(() => {
		setSourceEditorVisible((isVisible) => !isVisible);
		updateImageSource();
	}, [updateImageSource]);

	useEffect(() => {
		if (selectedBlock.type === "image") {
			editor.getEditorState().read(() => {
				const node = $getNodeByKey(selectedBlock.key);
				if (node && $isImageNode(node)) {
					setImageSourceInput(node.getSrc());
				} else {
					setSourceEditorVisible(false);
				}

				const element = editor.getElementByKey(selectedBlock.key);
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
	}, [editor, selectedBlock]);

	const iconSize = "18px";

	return createPortal(
		<>
			{sourceEditorVisible && (
				<FloatingContainer
					popupReference={popupReference}
					popupPlacement="top"
					popupOffset={-30}
				>
					<Box>
						<Input
							size="sm"
							w="400px"
							value={imageSourceInput}
							onChange={(e) => setImageSourceInput(e.target.value)}
						/>
					</Box>
				</FloatingContainer>
			)}
			<FloatingContainer
				popupReference={popupReference}
				popupPlacement="top"
				popupOffset={0}
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
								<RiAlignLeft
									color={text400}
									style={{
										height: iconSize,
										width: iconSize,
									}}
								/>
							}
							aria-label="Bold"
							variant="ghost"
							onClick={() =>
								editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")
							}
						/>
						<IconButton
							icon={
								<RiAlignCenter
									color={text400}
									style={{
										height: iconSize,
										width: iconSize,
									}}
								/>
							}
							aria-label="Bold"
							variant="ghost"
							onClick={() =>
								editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")
							}
						/>
						<IconButton
							icon={
								<RiAlignRight
									color={text400}
									style={{
										height: iconSize,
										width: iconSize,
									}}
								/>
							}
							aria-label="Bold"
							variant="ghost"
							onClick={() =>
								editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")
							}
						/>
						<Divider
							orientation="vertical"
							h="60%"
							alignSelf="center"
							bg="text.200"
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
							onClick={toggleSourceEditor}
						/>
					</ButtonGroup>
				</Box>
			</FloatingContainer>
		</>,
		anchorElem
	);
};

export default ImageMenuPlugin;
