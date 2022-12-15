/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $isCodeHighlightNode } from "@lexical/code";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
	Button,
	Box,
	ButtonGroup,
	IconButton,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	Divider,
	Popover,
	PopoverArrow,
	PopoverBody,
	PopoverCloseButton,
	PopoverContent,
	PopoverHeader,
	PopoverTrigger,
	useToken,
} from "@chakra-ui/react";
import {
	$createParagraphNode,
	$isNodeSelection,
	$isRootOrShadowRoot,
	LexicalEditor,
} from "lexical";
import { $wrapNodes } from "@lexical/selection";
import {
	$isListNode,
	INSERT_CHECK_LIST_COMMAND,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
	ListNode,
	REMOVE_LIST_COMMAND,
} from "@lexical/list";
import {
	$getSelection,
	$isRangeSelection,
	$isTextNode,
	COMMAND_PRIORITY_LOW,
	FORMAT_TEXT_COMMAND,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import {
	$createHeadingNode,
	$isHeadingNode,
	$createQuoteNode,
	HeadingTagType,
} from "@lexical/rich-text";
import { $findMatchingParent, $getNearestNodeOfType } from "@lexical/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import * as React from "react";
import { createPortal } from "react-dom";
import { getSelectedNode } from "../../utils/getSelectedNode";
import { setFloatingElemPosition } from "@components/Editor/utils/setFloatingPosition";
import { SHOW_FLOATING_WORD_EDITOR_COMMAND } from "@editor/Editor";
import {
	RxFontBold,
	RxArrowDown,
	RxText,
	RxListBullet,
	RxHalf1,
} from "react-icons/rx";
import {
	RiChatQuoteFill,
	RiDoubleQuotesL,
	RiH1,
	RiH2,
	RiListOrdered,
	RiListUnordered,
	RiParagraph,
} from "react-icons/ri";
import {
	IoEllipsisVertical,
	IoChevronDown,
	IoSearch,
	IoLanguage,
} from "react-icons/io5";

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

type FormatterParams = {
	editor: LexicalEditor;
	currentBlockType: string;
};
const formatHeading = ({
	editor,
	headingSize,
	currentBlockType,
}: FormatterParams & {
	headingSize: HeadingTagType;
}) => {
	editor.update(() => {
		const selection = $getSelection();

		if ($isRangeSelection(selection)) {
			if (currentBlockType === headingSize) {
				$wrapNodes(selection, () => $createParagraphNode());
			} else {
				$wrapNodes(selection, () => $createHeadingNode(headingSize));
			}
		}
	});
};

const formatParagraph = ({ editor, currentBlockType }: FormatterParams) => {
	if (currentBlockType !== "paragraph") {
		editor.update(() => {
			const selection = $getSelection();

			if ($isRangeSelection(selection)) {
				$wrapNodes(selection, () => $createParagraphNode());
			}
		});
	}
};

const formatBulletList = ({ editor, currentBlockType }: FormatterParams) => {
	if (currentBlockType !== "bullet") {
		editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
	} else {
		editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
	}
};

const formatCheckList = ({ editor, currentBlockType }: FormatterParams) => {
	if (currentBlockType !== "check") {
		editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
	} else {
		editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
	}
};

const formatNumberedList = ({ editor, currentBlockType }: FormatterParams) => {
	if (currentBlockType !== "number") {
		editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
	} else {
		editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
	}
};

const formatQuote = ({ editor, currentBlockType }: FormatterParams) => {
	if (currentBlockType !== "quote") {
		editor.update(() => {
			const selection = $getSelection();

			if ($isRangeSelection(selection)) {
				$wrapNodes(selection, () => $createQuoteNode());
			}
		});
	}
};

const blockTypes = {
	paragraph: {
		type: "Paragraph",
		icon: <RiParagraph size="100%" />,
		formatter: ({ editor, currentBlockType }: FormatterParams) =>
			formatParagraph({ editor, currentBlockType }),
	},
	h1: {
		type: "Title",
		icon: <RiH1 size="100%" />,
		formatter: ({ editor, currentBlockType }: FormatterParams) =>
			formatHeading({ editor, currentBlockType, headingSize: "h1" }),
	},
	h2: {
		type: "Subtitle",
		icon: <RiH2 size="100%" />,
		formatter: ({ editor, currentBlockType }: FormatterParams) =>
			formatHeading({ editor, currentBlockType, headingSize: "h2" }),
	},
	number: {
		type: "Numbered list",
		icon: <RiListOrdered size="100%" />,
		formatter: ({ editor, currentBlockType }: FormatterParams) =>
			formatNumberedList({ editor, currentBlockType }),
	},
	check: {
		type: "Check list",
		icon: <RiListUnordered size="100%" />,
		formatter: ({ editor, currentBlockType }: FormatterParams) =>
			formatCheckList({ editor, currentBlockType }),
	},
	bullet: {
		type: "Bullet List",
		icon: <RiListUnordered size="100%" />,
		formatter: ({ editor, currentBlockType }: FormatterParams) =>
			formatBulletList({ editor, currentBlockType }),
	},
	quote: {
		type: "Quote",
		icon: <RiDoubleQuotesL size="100%" />,
		formatter: ({ editor, currentBlockType }: FormatterParams) =>
			formatQuote({ editor, currentBlockType }),
	},
};

function TextFormatFloatingToolbar({
	editor,
	anchorElem,
	isLink,
	isBold,
	isItalic,
	isUnderline,
	isCode,
	isStrikethrough,
	isSubscript,
	isSuperscript,
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
}): JSX.Element {
	const popupCharStylesEditorRef = useRef<HTMLDivElement | null>(null);
	const [text400, text300] = useToken("colors", ["text.400", "text.300"]);

	const [currentBlockType, setCurrentBlockType] =
		useState<keyof typeof blockTypes>("paragraph");

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
	const updateTextFormatFloatingToolbar = useCallback(() => {
		const selection = $getSelection();

		const popupCharStylesEditorElem = popupCharStylesEditorRef.current;
		const nativeSelection = window.getSelection();

		if (popupCharStylesEditorElem === null) {
			return;
		}

		const rootElement = editor.getRootElement();
		if (
			selection !== null &&
			nativeSelection !== null &&
			!nativeSelection.isCollapsed &&
			rootElement !== null &&
			rootElement.contains(nativeSelection.anchorNode)
		) {
			const rangeRect = getDOMRangeRect(nativeSelection, rootElement);

			setFloatingElemPosition({
				targetRect: rangeRect,
				floatingElem: popupCharStylesEditorElem,
				anchorElem,
				verticalOffset: -45,
				pos: "top",
			});
		} else {
			setFloatingElemPosition({
				targetRect: null,
				floatingElem: popupCharStylesEditorElem,
				anchorElem,
				verticalOffset: -45,
				pos: "top",
			});
		}
		if ($isRangeSelection(selection)) {
			const anchorNode = selection.anchor.getNode();
			let element =
				anchorNode.getKey() === "root"
					? anchorNode
					: $findMatchingParent(anchorNode, (e) => {
							const parent = e.getParent();
							return parent !== null && $isRootOrShadowRoot(parent);
					  });

			if (element === null) {
				element = anchorNode.getTopLevelElementOrThrow();
			}

			const elementKey = element.getKey();
			const elementDOM = editor.getElementByKey(elementKey);

			if (elementDOM !== null) {
				if ($isListNode(element)) {
					const parentList = $getNearestNodeOfType<ListNode>(
						anchorNode,
						ListNode
					);
					const type = parentList
						? parentList.getListType()
						: element.getListType();
					setCurrentBlockType(type);
				} else {
					const type = $isHeadingNode(element)
						? element.getTag()
						: element.getType();
					if (type in blockTypes) {
						setCurrentBlockType(type as keyof typeof blockTypes);
					}
				}
			}
		}
		if ($isNodeSelection(selection)) {
			const anchorNode = selection.getNodes()[0];
			if (!anchorNode) {
				return;
			}
			let element =
				anchorNode.getKey() === "root"
					? anchorNode
					: $findMatchingParent(anchorNode, (e) => {
							const parent = e.getParent();
							return parent !== null && $isRootOrShadowRoot(parent);
					  });

			if (element === null) {
				element = anchorNode.getTopLevelElementOrThrow();
			}

			const elementKey = element.getKey();
			const elementDOM = editor.getElementByKey(elementKey);

			if (elementDOM !== null) {
				const type = $isHeadingNode(element)
					? element.getTag()
					: element.getType();
				if (type in blockTypes) {
					setCurrentBlockType(type as keyof typeof blockTypes);
				}
			}
		}
	}, [editor, anchorElem]);

	// Update pos on resize
	useEffect(() => {
		const scrollerElem = anchorElem.parentElement;

		const update = () => {
			editor.getEditorState().read(() => {
				updateTextFormatFloatingToolbar();
			});
		};

		window.addEventListener("resize", update);
		if (scrollerElem) {
			scrollerElem.addEventListener("scroll", update);
		}

		return () => {
			window.removeEventListener("resize", update);
			if (scrollerElem) {
				scrollerElem.removeEventListener("scroll", update);
			}
		};
	}, [editor, updateTextFormatFloatingToolbar, anchorElem]);

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

	const showWordEditor = useCallback(() => {
		editor.dispatchCommand(SHOW_FLOATING_WORD_EDITOR_COMMAND, undefined);
	}, [editor]);

	console.debug({ blockType: currentBlockType });

	return (
		<Box
			ref={popupCharStylesEditorRef}
			sx={{
				transition:
					"50ms transform ease-out, 50ms opacity ease-in-out, 0ms left linear",
				pos: "absolute",
				transformOrigin: "center left",
				zIndex: 10,
				display: "flex",
				borderRadius: "8px",
				bg: "white",
				border: "1px solid #e2e8f0",
				boxShadow: "0px 0px 4px 4px rgba(0, 0, 0, 0.05)",
			}}
		>
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
				<Menu>
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
										height: "24px",
										width: "24px",
									}}
								/>
							)}
						</Box>
					</MenuButton>
					<MenuList>
						{Object.entries(blockTypes)
							.filter(([key]) => key !== currentBlockType)
							.map(([key, block]) => (
								<MenuItem
									key={key}
									icon={
										<Box w="18" h="18" color="#696F80">
											{block.icon}
										</Box>
									}
									color="#40454f"
									onClick={() => block.formatter({ editor, currentBlockType })}
								>
									{block.type}
								</MenuItem>
							))}
					</MenuList>
				</Menu>
				<Divider orientation="vertical" h="60%" alignSelf="center" />
				<IconButton
					icon={
						<RxFontBold
							color="#696F80"
							style={{
								height: "24px",
								width: "24px",
							}}
						/>
					}
					aria-label="Bold"
					variant="ghost"
				/>
				<IconButton
					icon={
						<RxFontBold
							color="#696F80"
							style={{
								height: "24px",
								width: "24px",
							}}
						/>
					}
					aria-label="Bold"
					variant="ghost"
				/>
				<IconButton
					icon={
						<RxFontBold
							color="#696F80"
							style={{
								height: "24px",
								width: "24px",
							}}
						/>
					}
					aria-label="Bold"
					variant="ghost"
				/>
				<IconButton
					icon={
						<IoLanguage
							color="#696F80"
							style={{
								height: "20px",
								width: "20px",
							}}
						/>
					}
					aria-label="Bold"
					variant="ghost"
					onClick={showWordEditor}
				/>
				<Divider orientation="vertical" h="60%" alignSelf="center" />
				<Menu placement="bottom-start">
					<MenuButton
						as={IconButton}
						icon={
							<IoSearch
								color="#696F80"
								style={{
									height: "20px",
									width: "20px",
								}}
							/>
						}
						border="none"
					/>
					<MenuList>
						<MenuItem
							color="#40454f"
							onClick={() => {
								editor.getEditorState().read(() => {
									const selection = $getSelection();
									const text = selection?.getTextContent();
									if (text && window) {
										window
											.open(
												`https://wadoku.de/search/${encodeURIComponent(text)}`,
												"_blank"
											)
											?.focus();
									}
								});
							}}
						>
							Wadoku
						</MenuItem>
						<MenuItem color="#40454f">Jisho</MenuItem>
						<MenuItem color="#40454f">Google</MenuItem>
						<MenuItem color="#40454f">Baidu</MenuItem>
					</MenuList>
				</Menu>
			</ButtonGroup>
		</Box>
	);
}

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

			// Update links
			const parent = node.getParent();
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
		<TextFormatFloatingToolbar
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
		/>,
		anchorElem
	);
}

export default function FloatingTextFormatToolbarPlugin({
	anchorElem = document.body,
}: {
	anchorElem?: HTMLElement;
}): JSX.Element | null {
	const [editor] = useLexicalComposerContext();
	return useFloatingTextFormatToolbar(editor, anchorElem);
}
