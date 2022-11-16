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
	$getSelection,
	$isRangeSelection,
	$isTextNode,
	COMMAND_PRIORITY_LOW,
	FORMAT_TEXT_COMMAND,
	LexicalEditor,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import * as React from "react";
import { createPortal } from "react-dom";
import { getSelectedNode } from "../../utils/getSelectedNode";

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

const VERTICAL_GAP = -80;
const HORIZONTAL_OFFSET = 5;

export function setFloatingElemPosition(
	targetRect: ClientRect | null,
	floatingElem: HTMLElement,
	anchorElem: HTMLElement,
	verticalGap: number = VERTICAL_GAP,
	horizontalOffset: number = HORIZONTAL_OFFSET
): void {
	const scrollerElem = anchorElem.parentElement;

	if (targetRect === null || !scrollerElem) {
		floatingElem.style.opacity = "0";
		floatingElem.style.transform = "translate(-10000px, -10000px)";
		return;
	}

	const floatingElemRect = floatingElem.getBoundingClientRect();
	const anchorElementRect = anchorElem.getBoundingClientRect();
	const editorScrollerRect = scrollerElem.getBoundingClientRect();

	let top = targetRect.top - floatingElemRect.height - verticalGap;
	let left = targetRect.left - horizontalOffset;

	if (top < editorScrollerRect.top) {
		top += floatingElemRect.height + targetRect.height + verticalGap * 2;
	}

	if (left + floatingElemRect.width > editorScrollerRect.right) {
		left = editorScrollerRect.right - floatingElemRect.width - horizontalOffset;
	}

	top -= anchorElementRect.top;
	left -= anchorElementRect.left;

	floatingElem.style.opacity = "1";
	floatingElem.style.transform = `translate(${left}px, ${top}px)`;
}

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

			setFloatingElemPosition(rangeRect, popupCharStylesEditorElem, anchorElem);
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

	return (
		<div
			ref={popupCharStylesEditorRef}
			className="absolute top-0 left-0 flex h-[35px] rounded-sm bg-slate-200 p-1 opacity-0 shadow transition-opacity"
		>
			{editor.isEditable() && (
				<>
					<button
						onClick={() => {
							editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
						}}
						className="btn-ghost btn h-[10px]"
						aria-label="Format text as bold"
					>
						<i className="format bold">B</i>
					</button>
				</>
			)}
			<button
				onClick={insertComment}
				className="btn-ghost btn"
				aria-label="Insert comment"
			>
				<i className="format add-comment">C</i>
			</button>
		</div>
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

	if (!isText || isLink) {
		return null;
	}

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
