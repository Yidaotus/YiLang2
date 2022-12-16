import { $isWordNode } from "@components/Editor/nodes/WordNode";
import { setFloatingElemPosition } from "@components/Editor/utils/setFloatingPosition";

import { mergeRegister } from "@lexical/utils";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { trpc } from "@utils/trpc";
import { Box } from "@chakra-ui/react";
import {
	$getSelection,
	$isNodeSelection,
	SELECTION_CHANGE_COMMAND,
	COMMAND_PRIORITY_LOW,
} from "lexical";
import { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { IoChatboxEllipses, IoLanguageOutline } from "react-icons/io5";

const WordPopupPlugin = ({ anchorElem }: { anchorElem: HTMLElement }) => {
	const elem = useRef<HTMLDivElement | null>(null);
	const [wordNode, setWordNode] = useState<{
		id?: string;
		word: string;
		translations: Array<string>;
	} | null>(null);
	const dbWord = trpc.dictionary.getWord.useQuery(wordNode?.id || "", {
		enabled: !!wordNode?.id,
	});
	const [editor] = useLexicalComposerContext();

	const updatePopup = useCallback(() => {
		if (!elem.current) return;

		const selection = $getSelection();

		if (!$isNodeSelection(selection)) {
			setFloatingElemPosition({
				targetRect: null,
				floatingElem: elem.current,
				anchorElem,
			});
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

		if (!domPos || !elem.current) return;
		const clientRect = domPos.getBoundingClientRect();

		setFloatingElemPosition({
			targetRect: clientRect,
			floatingElem: elem.current,
			anchorElem,
			verticalOffset: 8,
		});
	}, [anchorElem, editor]);

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
		<Box
			ref={elem}
			sx={{
				minW: "150px",
				maxW: "400px",
				width: "max-content",
				pos: "absolute",
				transition:
					"100ms transform ease-out, 100ms opacity ease-out, 0ms left linear",
				transformOrigin: "top left",
				display: !!wordNode ? "block" : "none",
				top: 0,
				left: 0,
				zIndex: 30,
				borderRadius: "5px",
				bg: "white",
				border: "1px solid #e2e8f0",
				boxShadow: "0px 0px 8px 4px rgba(0, 0, 0, 0.05)",
			}}
		>
			<Box
				pos="absolute"
				zIndex={50}
				w="10px"
				h="10px"
				left="50%"
				top="-6px"
				transform="scale(1.4, 0.8) translate(-50%) rotate(45deg)"
				borderTop="1px solid #e2e8f0"
				borderLeft="1px solid #e2e8f0"
				bg="#FFFFFF"
			/>
			{dbWord.data && (
				<Box sx={{ display: "flex", flexDir: "column" }} p={2}>
					<Box fontSize="1.4em" color="text.500">
						{dbWord.data.word}
					</Box>
					{dbWord.data.spelling && (
						<Box fontSize="0.8em" color="text.300" flexGrow="1">
							{dbWord.data.spelling}
						</Box>
					)}
					<Box display="flex" alignItems="center">
						<Box fontSize="1em" color="text.400" flexGrow="1">
							{dbWord.data.translations.join(", ")}
						</Box>
						<Box display="flex" pl={6} gap={1}>
							{dbWord.data.tags.map((t) => (
								<Box
									key={t.tagId}
									borderRadius="100%"
									border={`5px solid ${t.tag.color}`}
								/>
							))}
						</Box>
					</Box>
				</Box>
			)}
			{dbWord.data?.comment && (
				<Box
					bg="text.100"
					color="text.400"
					pl={4}
					pr={2}
					py={1}
					borderRadius="0px 0px 4px 4px"
					fontSize="0.9em"
					alignItems="center"
					gap={2}
					display="flex"
					borderColor="text.100"
					borderWidth="1px 0px 0px 0px"
				>
					<IoChatboxEllipses color="text.400" size="18" />
					{dbWord.data.comment}
				</Box>
			)}
		</Box>,
		anchorElem
	);
};

export default WordPopupPlugin;
