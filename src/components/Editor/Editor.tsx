import type { Klass, LexicalCommand, LexicalNode } from "lexical";

import { ListNode, ListItemNode } from "@lexical/list";

import React, { useState } from "react";
import { createCommand } from "lexical";

import { Box, useBreakpointValue } from "@chakra-ui/react";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HashtagNode } from "@lexical/hashtag";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { MarkNode } from "@lexical/mark";
import { OverflowNode } from "@lexical/overflow";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";

import YiLangTheme from "./themes/YiLangEditorTheme";
import ErrorBoundary from "./ui/ErrorBoundary";
import { WordNode } from "./nodes/WordNode";
import FloatingTextFormatToolbarPlugin from "./plugins/FloatingToolbarPlugin/FloatingToolbarPlugin";
import FloatingWordEditorPlugin from "./plugins/FloatingWordEditor/FloatingWordEditor";
import FetchDocumentPlugin from "./plugins/FetchDocumentPlugin/FetchDocumentPlugin";
import PersistStateOnPageChangePlugion from "./plugins/PersistantStateOnPageChangePlugin/PersistantStateOnPageChangePlugin";
import { ImageNode } from "./nodes/ImageNode";
import ImagesPlugin from "./plugins/ImagePlugin/ImagePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import ListMaxIndentLevelPlugin from "./plugins/ListMaxIndentLevelPlugin/ListMaxIndentLevelPlugin";

import WordPopupPlugin from "./plugins/WordPopupPlugin/WordPopupPlugin";
import GetDocumentTitlePlugin from "./plugins/GetDocumentTitlePlugin/GetDocumentTitlePlugin";
import MinimapPlugin from "./plugins/MinimapPlugin/MinimapPlugin";
import SidebarPlugin from "./plugins/SidebarPlugin/SidebarPlugin";
import useEditorStore from "@store/store";
import SelectedBlockTypePlugin from "./plugins/SelectedBlockTypePlugin/SelectedBlockTypePlugin";

import shallow from "zustand/shallow";
import { CustomContentEditable } from "./plugins/CustomContentEditable/CustomContentEditable";
import ImageMenuPlugin from "./plugins/ImageMenuPlugin/ImageMenuPlugin";
import BlockSelectPopupPlugin from "./plugins/BlockSelectPopup/BlockSelectPopupPlugin";

const EditorNodes: Array<Klass<LexicalNode>> = [
	HeadingNode,
	ListNode,
	ListItemNode,
	QuoteNode,
	CodeNode,
	TableNode,
	TableCellNode,
	TableRowNode,
	HashtagNode,
	CodeHighlightNode,
	AutoLinkNode,
	LinkNode,
	OverflowNode,
	HorizontalRuleNode,
	ImageNode,
	MarkNode,
	WordNode,
];

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: Error) {
	console.error(error);
}

export const SHOW_FLOATING_WORD_EDITOR_COMMAND: LexicalCommand<void> =
	createCommand("SHOW_FLOATING_WORD_EDITOR_COMMAN");

type EditorProps = {
	documentId: string;
	scrollAnchor?: HTMLElement;
	sidebarPortal?: HTMLElement;
	setDocumentTitle: (title: string) => void;
};
export default React.memo(function Editor({
	documentId,
	scrollAnchor,
	sidebarPortal,
	setDocumentTitle,
}: EditorProps) {
	const {
		editorFontSize,
		editorLineHeight,
		editorShowSpelling,
		setEditorSelectedBlockType,
	} = useEditorStore(
		(state) => ({
			editorFontSize: state.editorFontSize,
			editorLineHeight: state.editorLineHeight,
			editorShowSpelling: state.editorShowSpelling,
			setEditorSelectedBlockType: state.setEditorSelectedBlock,
		}),
		shallow
	);

	const initialConfig = {
		namespace: "MyEditor",
		theme: YiLangTheme,
		editorState: undefined,
		onError,
		nodes: [...EditorNodes],
	};

	const [floatingAnchorElem, setFloatingAnchorElem] =
		useState<HTMLDivElement | null>(null);
	const onFloatingRef = (_floatingAnchorElem: HTMLDivElement) => {
		if (_floatingAnchorElem !== null) {
			setFloatingAnchorElem(_floatingAnchorElem);
		}
	};

	const fontSize = ((editorFontSize + 20) / 100) * 8 + 14;
	let lineHeight = ((editorLineHeight + 20) / 100) * 1 + 1.0;
	if (editorShowSpelling) {
		lineHeight += 0.9;
	}

	const isSemiReadOnly = useBreakpointValue(
		{
			base: true,
			md: false,
		},
		{
			fallback: "md",
		}
	);

	return (
		<Box>
			<Box display="flex" justifyContent="center" w="100%" pos="relative">
				<LexicalComposer initialConfig={initialConfig}>
					<RichTextPlugin
						contentEditable={
							<Box
								sx={{
									"*::selection": {
										bg: "text.100",
										borderRadius: "5px",
									},
								}}
								width="100%"
								minH="200px"
								ref={onFloatingRef}
								contentEditable={false}
							>
								<CustomContentEditable
									semiReadOnly={isSemiReadOnly}
									autoFocus
									style={{
										width: "100%",
										minHeight: "100px",
										transition:
											"100ms font-size ease-out, 300ms line-height ease-out",
										outline: "none",
										fontSize: `${fontSize}px`,
										lineHeight: `${lineHeight}em`,
									}}
								/>
							</Box>
						}
						placeholder={
							<Box
								fontSize="2xl"
								as="span"
								pos="absolute"
								left="0"
								top="6px"
								color="text.300"
								pointerEvents="none"
								userSelect="none"
							>
								Enter your document here
							</Box>
						}
						ErrorBoundary={ErrorBoundary}
					/>
					<HistoryPlugin />
					<PersistStateOnPageChangePlugion documentId={documentId} />
					<FetchDocumentPlugin id={documentId} />
					<TabIndentationPlugin />
					<ListMaxIndentLevelPlugin maxDepth={4} />
					<GetDocumentTitlePlugin setDocumentTitle={setDocumentTitle} />
					<ListPlugin />
					<ImagesPlugin />
					<SelectedBlockTypePlugin
						setSelectedBlockType={setEditorSelectedBlockType}
					/>
					<>
						{scrollAnchor && sidebarPortal && (
							<>
								<MinimapPlugin
									anchorElem={scrollAnchor}
									sidebarPortal={sidebarPortal}
								/>
								<SidebarPlugin
									sidebarPortal={sidebarPortal}
									documentId={documentId}
								/>
							</>
						)}
						{floatingAnchorElem && (
							<>
								<BlockSelectPopupPlugin anchorElem={floatingAnchorElem} />
								<ImageMenuPlugin anchorElem={floatingAnchorElem} />
								<FloatingTextFormatToolbarPlugin
									anchorElem={floatingAnchorElem}
									documentId={documentId}
								/>
								<FloatingWordEditorPlugin
									documentId={documentId}
									anchorElem={floatingAnchorElem}
								/>
								<WordPopupPlugin anchorElem={floatingAnchorElem} />
							</>
						)}
					</>
				</LexicalComposer>
			</Box>
		</Box>
	);
});
