import { $isWordNode } from "@components/Editor/nodes/WordNode";

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
import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { IoChatboxEllipses } from "react-icons/io5";
import { arrow, flip, offset, shift, useFloating } from "@floating-ui/react";

const WordPopupPlugin = ({ anchorElem }: { anchorElem: HTMLElement }) => {
	const [wordNode, setWordNode] = useState<{
		id?: string;
		word: string;
		translations: Array<string>;
	} | null>(null);
	const dbWord = trpc.dictionary.getWord.useQuery(wordNode?.id || "", {
		enabled: !!wordNode?.id,
	});
	const [editor] = useLexicalComposerContext();

	const [popupVisible, setPopupVisible] = useState(false);
	const arrowRef = useRef(null);
	const { x, y, reference, floating, strategy, placement } = useFloating({
		placement: "bottom",
		middleware: [offset(10), shift(), arrow({ element: arrowRef }), flip()],
	});

	const updatePopup = useCallback(() => {
		const selection = $getSelection();

		if (!$isNodeSelection(selection)) {
			setPopupVisible(false);
			reference(null);
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
		reference(domPos);
		setPopupVisible(true);

		/*
		setFloatingElemPosition({
			targetRect: clientRect,
			floatingElem: popperE.current,
			anchorElem,
			verticalOffset: 8,
		});
	*/
	}, [editor, reference]);

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
			ref={floating}
			style={{
				position: strategy,
				top: y ?? 0,
				left: x ?? 0,
				width: "max-content",
			}}
			userSelect={popupVisible ? "inherit" : "none"}
			pointerEvents={popupVisible ? "inherit" : "none"}
			width={["100vw", null, "max-content"]}
			px={[2, null, 0]}
		>
			<Box
				minW={["unset", null, "150px"]}
				maxW={["unset", null, "400px"]}
				opacity={popupVisible ? 1 : 0}
				transform={popupVisible ? "scale(1)" : "scale(0.9)"}
				sx={{
					transition:
						"100ms transform ease-out, 100ms opacity ease-out, 0ms left linear",
					zIndex: 30,
					borderRadius: "5px",
					bg: "white",
					border: "1px solid #e2e8f0",
					boxShadow: "0px 0px 8px 4px rgba(0, 0, 0, 0.05)",
				}}
			>
				<Box ref={arrowRef} zIndex={20}>
					<Box
						pos="absolute"
						w="10px"
						h="10px"
						left="50%"
						bottom={placement === "top" ? "-2px" : undefined}
						top={placement === "bottom" ? "-10px" : undefined}
						transform={`scale(1.4, 0.8) translate(-50%, 50%)
						 ${placement === "top" ? "rotate(-135deg)" : "rotate(45deg)"}`}
						borderTop="1px solid #e2e8f0"
						borderLeft="1px solid #e2e8f0"
						bg="#FFFFFF"
					/>
				</Box>
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
						pos="relative"
						zIndex={30}
					>
						<IoChatboxEllipses color="text.400" size="18" />
						{dbWord.data.comment}
					</Box>
				)}
			</Box>
		</Box>,
		anchorElem
	);
};

export default WordPopupPlugin;
