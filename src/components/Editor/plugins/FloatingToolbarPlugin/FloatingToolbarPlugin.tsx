import {
	Box,
	Button,
	ButtonGroup,
	Divider,
	IconButton,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	Spinner,
	useToken,
} from "@chakra-ui/react";
import FloatingContainer from "@components/Editor/ui/FloatingContainer";
import { blockTypes } from "@components/Editor/utils/blockTypeFormatters";
import type { ReferenceType } from "@floating-ui/react";
import { $isCodeHighlightNode } from "@lexical/code";
import { $isLinkNode } from "@lexical/link";
import { $wrapSelectionInMarkNode } from "@lexical/mark";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import useEditorStore from "@store/store";
import { trpc } from "@utils/trpc";
import type { ElementFormatType, LexicalEditor } from "lexical";
import {
	$getSelection,
	$isElementNode,
	$isRangeSelection,
	$isTextNode,
	COMMAND_PRIORITY_LOW,
	FORMAT_ELEMENT_COMMAND,
	FORMAT_TEXT_COMMAND,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
	IoCheckmark,
	IoChevronDown,
	IoLanguage,
	IoSearch,
} from "react-icons/io5";

import {
	RiAlignCenter,
	RiAlignJustify,
	RiAlignLeft,
	RiAlignRight,
	RiBold,
	RiItalic,
	RiMarkPenLine,
	RiParagraph,
	RiUnderline,
} from "react-icons/ri";
import shallow from "zustand/shallow";
import { getSelectedNode } from "../../utils/getSelectedNode";
import { SHOW_FLOATING_WORD_EDITOR_COMMAND } from "../FloatingWordEditor/FloatingWordEditor";
import { INSERT_WORD } from "../WordPlugin/WordPlugin";

export function getDOMRangeRect(
	nativeSelection: Selection,
	rootElement: HTMLElement
): DOMRect {
	const domRange = nativeSelection.getRangeAt(0);

	let rect;

	if (nativeSelection.anchorNode === rootElement) {
		let inner = rootElement;
		while (inner.firstElementChild != null) {
			inner = inner.firstElementChild as HTMLElement;
		}
		rect = inner.getBoundingClientRect();
	} else {
		rect = domRange.getBoundingClientRect();
	}

	return rect;
}

const useWordEditorDispatch = () => {
	const [editor] = useLexicalComposerContext();
	const [searchWord, setSearchWord] = useState<string | null>(null);
	const trpcUtils = trpc.useContext();
	const activeLanguage = useEditorStore((store) => store.selectedLanguage);
	const findWord = trpc.dictionary.findWord.useQuery(
		{ word: searchWord || "", language: activeLanguage.id },
		{
			enabled: !!searchWord,
			onSuccess: (word) => {
				if (word) {
					trpcUtils.dictionary.getWord.setData(word, { id: word.id });
				}
			},
		}
	);

	useEffect(() => {
		if (findWord.status === "success") {
			const word = findWord.data;
			if (word) {
				editor.dispatchCommand(INSERT_WORD, word);
			} else {
				editor.dispatchCommand(SHOW_FLOATING_WORD_EDITOR_COMMAND, undefined);
			}
			setSearchWord(null);
		}
	}, [editor, findWord.data, findWord.status]);

	return [setSearchWord, findWord.isFetching] as const;
};

function TextFormatFloatingToolbar({
	editor,
	isBold,
	isItalic,
	isUnderline,
	alignment,
}: {
	editor: LexicalEditor;
	anchorElem: HTMLElement;
	isBold: boolean;
	isCode: boolean;
	isItalic: boolean;
	isLink: boolean;
	isStrikethrough: boolean;
	isSubscript: boolean;
	isSuperscript: boolean;
	isUnderline: boolean;
	alignment: ElementFormatType | null;
}): JSX.Element {
	const [text400, text500, brand500] = useToken("colors", [
		"text.400",
		"text.500",
		"brand.800",
	]);

	const { type: currentBlockType } = useEditorStore(
		(state) => state.editorSelectedBlock,
		shallow
	);

	const activeLanguage = useEditorStore((store) => store.selectedLanguage);
	const lookupSources = trpc.dictionary.getAllLookupSources.useQuery(
		{ languageId: activeLanguage.id },
		{ enabled: !!activeLanguage }
	);
	const [setSearchWord, isLoadingWordEditor] = useWordEditorDispatch();

	/*
	const insertLink = useCallback(() => {
		if (!isLink) {
			editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
		} else {
			editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
		}
	}, [editor, isLink]);

	const insertComment = () => {
		// editor.dispatchCommand(INSERT_INLINE_COMMAND, undefined);
	};

	// pos

	// Update pos on resize
	*/

	const showWordEditor = useCallback(() => {
		editor.getEditorState().read(async () => {
			const selection = $getSelection();
			if (!selection || !$isRangeSelection(selection)) return;
			const text = selection.getTextContent();
			setSearchWord(text);
		});
	}, [editor, setSearchWord]);

	const openExternalDictionary = useCallback(
		(templateUrl: string) => {
			editor.getEditorState().read(() => {
				const selection = $getSelection();
				const text = selection?.getTextContent();
				const url = templateUrl.replace(
					"{word}",
					encodeURIComponent(text || "")
				);

				if (text && window && url) {
					window.open(url, "_blank")?.focus();
				}
			});
		},
		[editor]
	);

	const iconSize = "18px";
	return (
		<Box pos="relative" zIndex={50} display="flex">
			{isLoadingWordEditor && (
				<Box
					w="100%"
					h="100%"
					pos="absolute"
					left="0"
					top="0"
					bg="#00000040"
					borderRadius={4}
					zIndex={50}
					display="flex"
					justifyContent="center"
					alignItems="center"
				>
					<Spinner color="white" />
				</Box>
			)}
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
				<Menu placement="bottom">
					<MenuButton
						as={Button}
						rightIcon={<IoChevronDown color={text400} />}
						border="none"
					>
						<Box minW="18" minH="18" w="18" h="18" color="#696F80">
							{blockTypes[currentBlockType]?.icon || (
								<RiParagraph
									color="#696F80"
									style={{
										height: iconSize,
										width: iconSize,
									}}
								/>
							)}
						</Box>
					</MenuButton>
					<MenuList fontSize={16}>
						{Object.entries(blockTypes).map(([key, block]) => (
							<MenuItem
								py={1}
								key={key}
								icon={
									<Box w={iconSize} h={iconSize} color={text400}>
										{block.icon}
									</Box>
								}
								color={text500}
								onClick={() => block.formatter({ editor, currentBlockType })}
							>
								<Box
									display="flex"
									justifyContent="space-between"
									alignItems="center"
								>
									{block.type}
									{key === currentBlockType && <IoCheckmark color={brand500} />}
								</Box>
							</MenuItem>
						))}
					</MenuList>
				</Menu>
				<Divider
					orientation="vertical"
					h="60%"
					alignSelf="center"
					bg="text.200"
				/>
				<IconButton
					icon={
						<RiBold
							color={isBold ? brand500 : text400}
							style={{
								height: iconSize,
								width: iconSize,
							}}
						/>
					}
					aria-label="Bold"
					variant="ghost"
					onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
				/>
				<IconButton
					icon={
						<RiItalic
							color={isItalic ? brand500 : text400}
							style={{
								height: iconSize,
								width: iconSize,
							}}
						/>
					}
					aria-label="Bold"
					variant="ghost"
					onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
				/>
				<IconButton
					icon={
						<RiUnderline
							color={isUnderline ? brand500 : text400}
							style={{
								height: iconSize,
								width: iconSize,
							}}
						/>
					}
					aria-label="Bold"
					variant="ghost"
					onClick={() =>
						editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
					}
				/>

				<Divider
					orientation="vertical"
					h="60%"
					alignSelf="center"
					bg="text.200"
				/>
				<IconButton
					icon={
						<RiAlignLeft
							color={isUnderline ? brand500 : text400}
							style={{
								height: iconSize,
								width: iconSize,
							}}
						/>
					}
					bg={alignment === "left" ? "text.100" : "inherit"}
					aria-label="Bold"
					variant="ghost"
					onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}
				/>
				<IconButton
					icon={
						<RiAlignJustify
							color={isUnderline ? brand500 : text400}
							style={{
								height: iconSize,
								width: iconSize,
							}}
						/>
					}
					bg={alignment === "justify" ? "text.100" : "inherit"}
					aria-label="Bold"
					variant="ghost"
					onClick={() =>
						editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify")
					}
				/>
				<IconButton
					icon={
						<RiAlignCenter
							color={isUnderline ? brand500 : text400}
							style={{
								height: iconSize,
								width: iconSize,
							}}
						/>
					}
					bg={alignment === "center" ? "text.100" : "inherit"}
					aria-label="Bold"
					variant="ghost"
					onClick={() =>
						editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")
					}
				/>
				<IconButton
					icon={
						<RiAlignRight
							color={isUnderline ? brand500 : text400}
							style={{
								height: iconSize,
								width: iconSize,
							}}
						/>
					}
					bg={alignment === "right" ? "text.100" : "inherit"}
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
					icon={
						<RiMarkPenLine
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
						editor.update(() => {
							const selection = $getSelection();
							if ($isRangeSelection(selection)) {
								const isBackward = selection.isBackward();
								$wrapSelectionInMarkNode(selection, isBackward, "test");
							}
						})
					}
				/>
				<IconButton
					icon={
						<IoLanguage
							color="#696F80"
							style={{
								height: iconSize,
								width: iconSize,
							}}
						/>
					}
					aria-label="Bold"
					variant="ghost"
					onClick={showWordEditor}
				/>
				<Divider
					orientation="vertical"
					h="60%"
					alignSelf="center"
					bg="text.200"
				/>
				<Menu placement="bottom" size="sm">
					<MenuButton
						as={IconButton}
						icon={
							<IoSearch
								color="#696F80"
								style={{
									height: iconSize,
									width: iconSize,
								}}
							/>
						}
						border="none"
					/>
					<MenuList fontSize={16}>
						{lookupSources.data?.map((lookupSource) => (
							<MenuItem
								key={lookupSource.id}
								py={1}
								color="#40454f"
								onClick={() => openExternalDictionary(lookupSource.url)}
							>
								{lookupSource.name}
							</MenuItem>
						))}
					</MenuList>
				</Menu>
			</ButtonGroup>
		</Box>
	);
}

const TextFormatFloatingToolbarMemo = React.memo(TextFormatFloatingToolbar);

function useFloatingTextFormatToolbar(
	editor: LexicalEditor,
	anchorElem: HTMLElement
): JSX.Element | null {
	const [isText, setIsText] = useState(false);
	const [isLink, setIsLink] = useState(false);
	const [isBold, setIsBold] = useState(false);
	const [isItalic, setIsItalic] = useState(false);
	const [isUnderline, setIsUnderline] = useState(false);
	const [isStrikethrough, setIsStrikethrough] = useState(false);
	const [isSubscript, setIsSubscript] = useState(false);
	const [isSuperscript, setIsSuperscript] = useState(false);
	const [isCode, setIsCode] = useState(false);
	const [alignment, setAlignment] = useState<ElementFormatType | null>(null);
	const [popupReference, setPopupReference] = useState<ReferenceType | null>(
		null
	);

	const updateTextFormatFloatingToolbar = useCallback(() => {
		const selection = $getSelection();

		const nativeSelection = window.getSelection();

		const rootElement = editor.getRootElement();
		if (
			selection !== null &&
			nativeSelection !== null &&
			!nativeSelection.isCollapsed &&
			rootElement !== null &&
			rootElement.contains(nativeSelection.anchorNode)
		) {
			const rangeRect = getDOMRangeRect(nativeSelection, rootElement);
			setPopupReference({ getBoundingClientRect: () => rangeRect });
		} else {
			setPopupReference(null);
		}
	}, [editor]);

	useEffect(() => {
		editor.getEditorState().read(() => {
			updateTextFormatFloatingToolbar();
		});
		return mergeRegister(
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(() => {
					updateTextFormatFloatingToolbar();
				});
			}),

			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					updateTextFormatFloatingToolbar();
					return false;
				},
				COMMAND_PRIORITY_LOW
			)
		);
	}, [editor, updateTextFormatFloatingToolbar]);

	const updatePopup = useCallback(() => {
		editor.getEditorState().read(() => {
			// Should not to pop up the floating toolbar when using IME input
			if (editor.isComposing()) {
				return;
			}
			const selection = $getSelection();
			const nativeSelection = window.getSelection();
			const rootElement = editor.getRootElement();

			if (
				nativeSelection !== null &&
				(!$isRangeSelection(selection) ||
					rootElement === null ||
					!rootElement.contains(nativeSelection.anchorNode))
			) {
				setIsText(false);
				return;
			}

			if (!$isRangeSelection(selection)) {
				return;
			}

			const node = getSelectedNode(selection);

			// Update text format
			setIsBold(selection.hasFormat("bold"));
			setIsItalic(selection.hasFormat("italic"));
			setIsUnderline(selection.hasFormat("underline"));
			setIsStrikethrough(selection.hasFormat("strikethrough"));
			setIsSubscript(selection.hasFormat("subscript"));
			setIsSuperscript(selection.hasFormat("superscript"));
			setIsCode(selection.hasFormat("code"));

			const parent = node.getParent();
			if ($isElementNode(parent)) {
				const format = parent.getFormatType();
				setAlignment(format);
			}

			if ($isLinkNode(parent) || $isLinkNode(node)) {
				setIsLink(true);
			} else {
				setIsLink(false);
			}

			if (
				!$isCodeHighlightNode(selection.anchor.getNode()) &&
				selection.getTextContent() !== ""
			) {
				setIsText($isTextNode(node));
			} else {
				setIsText(false);
			}
		});
	}, [editor]);

	useEffect(() => {
		document.addEventListener("selectionchange", updatePopup);
		return () => {
			document.removeEventListener("selectionchange", updatePopup);
		};
	}, [updatePopup]);

	useEffect(() => {
		return mergeRegister(
			editor.registerUpdateListener(() => {
				updatePopup();
			}),
			editor.registerRootListener(() => {
				if (editor.getRootElement() === null) {
					setIsText(false);
				}
			})
		);
	}, [editor, updatePopup]);

	return createPortal(
		<FloatingContainer
			popupReference={popupReference}
			popupPlacement="top"
			showArrow
		>
			<TextFormatFloatingToolbarMemo
				editor={editor}
				anchorElem={anchorElem}
				isLink={isLink}
				isBold={isBold}
				isItalic={isItalic}
				isStrikethrough={isStrikethrough}
				isSubscript={isSubscript}
				isSuperscript={isSuperscript}
				isUnderline={isUnderline}
				isCode={isCode}
				alignment={alignment}
			/>
		</FloatingContainer>,
		anchorElem
	);
}

export default function FloatingTextFormatToolbarPlugin({
	anchorElem = document.body,
	documentId,
}: {
	anchorElem?: HTMLElement;
	documentId: string;
}): JSX.Element | null {
	const [editor] = useLexicalComposerContext();
	return useFloatingTextFormatToolbar(editor, anchorElem);
}
