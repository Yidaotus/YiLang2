import type { Klass, LexicalNode } from "lexical";
import { createCommand } from "lexical";

import { Box, useBreakpointValue } from "@chakra-ui/react";
import { ListItemNode, ListNode } from "@lexical/list";

import React, { useLayoutEffect, useState } from "react";

import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HashtagNode } from "@lexical/hashtag";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { MarkNode } from "@lexical/mark";
import { OverflowNode } from "@lexical/overflow";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";

import {
	DialogueContainerNode,
	DialogueSpeakerNode,
	DialogueSpeechNode,
} from "./nodes/Dialogue";

import { ImageNode } from "./nodes/ImageNode";
import { SentenceNode } from "./nodes/Sentence/SentenceNode";
import { WordNode } from "./nodes/WordNode";
import FetchDocumentPlugin from "./plugins/FetchDocumentPlugin/FetchDocumentPlugin";
import FloatingTextFormatToolbarPlugin from "./plugins/FloatingToolbarPlugin/FloatingToolbarPlugin";
import FloatingWordEditorPlugin from "./plugins/FloatingWordEditor/FloatingWordEditor";
import ImagesPlugin from "./plugins/ImagePlugin/ImagePlugin";
import PersistStateOnPageChangePlugion from "./plugins/PersistantStateOnPageChangePlugin/PersistantStateOnPageChangePlugin";
import TableCellActionMenuPlugin from "./plugins/TableActionMenuPlugin";
import YiLangTheme from "./themes/YiLangEditorTheme";
import ErrorBoundary from "./ui/ErrorBoundary";

import { RemarkContainerNode } from "./nodes/Remark/RemarkContainerNode";
import { RemarkContentNode } from "./nodes/Remark/RemarkContentNode";
import { RemarkTitleNode } from "./nodes/Remark/RemarkTitleNode";
import RemarkPlugin from "./plugins/RemarkBlockPlugin/RemarkPlugin";

import { GrammarPointContainerNode } from "./nodes/GrammarPoint/GrammarPointContainerNode";
import { GrammarPointContentNode } from "./nodes/GrammarPoint/GrammarPointContentNode";
import { GrammarPointTitleNode } from "./nodes/GrammarPoint/GrammarPointTitleNode";

import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import ListMaxIndentLevelPlugin from "./plugins/ListMaxIndentLevelPlugin/ListMaxIndentLevelPlugin";

import useEditorStore from "@store/store";
import GetDocumentTitlePlugin from "./plugins/GetDocumentTitlePlugin/GetDocumentTitlePlugin";
import MinimapPlugin from "./plugins/MinimapPlugin/MinimapPlugin";
import SelectedBlockTypePlugin from "./plugins/SelectedBlockTypePlugin/SelectedBlockTypePlugin";
import SidebarPlugin from "./plugins/SidebarPlugin/SidebarPlugin";
import WordPopupPlugin from "./plugins/WordPopupPlugin/WordPopupPlugin";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import shallow from "zustand/shallow";
import { SentenceToggleNode } from "./nodes/Sentence/SentenceToggleNode";
import { SplitLayoutColumnNode } from "./nodes/SplitLayout/SplitLayoutColumn";
import { SplitLayoutContainerNode } from "./nodes/SplitLayout/SplitLayoutContainer";
import BlockSelectPopupPlugin from "./plugins/BlockSelectPopup/BlockSelectPopupPlugin";
import { CustomContentEditable } from "./plugins/CustomContentEditable/CustomContentEditable";
import GrammarPointPlugin from "./plugins/GrammarPointPlugin/GrammarPointPlugin";
import ImageMenuPlugin from "./plugins/ImageMenuPlugin/ImageMenuPlugin";
import IndexElementsPlugin from "./plugins/IndexElementsPlugin/IndexElementsPlugin";
import PasteImageFromClipboardPlugin from "./plugins/PasteImageFromClipboardPlugin/PasteImageFromClipboardPlugin";
import SaveImagesPlugin from "./plugins/SaveImagesPlugin/SaveImagesPlugin";
import SaveOnBlurPlugin from "./plugins/SaveOnBlur/SaveOnBlurPlugin";
import SaveToDBPlugin from "./plugins/SaveToDBPlugin/SaveToDBPlugin";
import SentenceMenuPlugin from "./plugins/SentenceMenuPlugin/SentenceMenuPlugin";
import SentencePlugin from "./plugins/SentencePlugin/SentencePlugin";
import SentencePopupPlugin from "./plugins/SentencePopupPlugin/SentencePopupPlugin";
import SplitLayoutPlugin from "./plugins/SplitLayoutPlugin/SplitLayoutPlugin";
import TableCellResizerPlugin from "./plugins/TableCellResizer";
import TreeViewPlugin from "./plugins/TreeViewPlugin/TreeViewPlugin";
import WordPlugin from "./plugins/WordPlugin/WordPlugin";

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
	RemarkContainerNode,
	RemarkContentNode,
	RemarkTitleNode,
	GrammarPointContainerNode,
	GrammarPointContentNode,
	GrammarPointTitleNode,
	SplitLayoutContainerNode,
	SplitLayoutColumnNode,
	SentenceNode,
	SentenceToggleNode,
	DialogueContainerNode,
	DialogueSpeakerNode,
	DialogueSpeechNode,
];

const DebugPlugin = () => {
	const [editor] = useLexicalComposerContext();

	useLayoutEffect(() => {
		return editor.registerUpdateListener(() => {
			/*console.log({ prevEditorState });
				editorState.read(() => {
					for (const key of dirtyElements.keys()) {
						const node = $getNodeByKey(key);
						if (node && isSaveable(node)) {
							node.saveToDatabase();
						}
					}
				});
			*/
		});
	}, [editor]);
};

export const HIGHLIGHT_NODE_COMMAND = createCommand<string>("HIGHLIGHT_NODE");

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: Error) {
	console.error(error);
}

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
		lineHeight += 0.0;
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
			<Box
				display="flex"
				justifyContent="center"
				pos="relative"
				flexDir="column"
			>
				<LexicalComposer initialConfig={initialConfig}>
					<RichTextPlugin
						contentEditable={
							<Box
								sx={{
									"*::selection": {
										bg: "#b3d4fc",
										borderRadius: "5px",
									},
								}}
								minH="200px"
								ref={onFloatingRef}
								contentEditable={false}
							>
								<CustomContentEditable
									semiReadOnly={isSemiReadOnly}
									autoFocus
									style={{
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
					<RemarkPlugin />
					<GrammarPointPlugin />
					<HistoryPlugin />
					<PersistStateOnPageChangePlugion />
					<FetchDocumentPlugin documentId={documentId} />
					<SplitLayoutPlugin />
					<TabIndentationPlugin />
					<ListMaxIndentLevelPlugin maxDepth={4} />
					<GetDocumentTitlePlugin setDocumentTitle={setDocumentTitle} />
					<ListPlugin />
					<WordPlugin />
					<ImagesPlugin />
					<SaveToDBPlugin documentId={documentId} />
					<SentencePlugin />
					<SaveOnBlurPlugin />
					<IndexElementsPlugin documentId={documentId} />
					<SaveImagesPlugin />
					<PasteImageFromClipboardPlugin />
					<SelectedBlockTypePlugin
						setSelectedBlockType={setEditorSelectedBlockType}
					/>
					<TablePlugin />
					<TableCellResizerPlugin />
					<>
						{scrollAnchor && sidebarPortal && (
							<>
								<MinimapPlugin
									anchorElem={scrollAnchor}
									sidebarPortal={sidebarPortal}
								/>
								<SidebarPlugin sidebarPortal={sidebarPortal} />
							</>
						)}
						{floatingAnchorElem && (
							<>
								<TableCellActionMenuPlugin
									floatingAnchorElem={floatingAnchorElem}
								/>
								<BlockSelectPopupPlugin anchorElem={floatingAnchorElem} />
								<ImageMenuPlugin anchorElem={floatingAnchorElem} />
								<SentenceMenuPlugin anchorElem={floatingAnchorElem} />
								<FloatingTextFormatToolbarPlugin
									anchorElem={floatingAnchorElem}
									documentId={documentId}
								/>
								<FloatingWordEditorPlugin
									documentId={documentId}
									anchorElem={floatingAnchorElem}
								/>
								<WordPopupPlugin anchorElem={floatingAnchorElem} />
								<SentencePopupPlugin anchorElem={floatingAnchorElem} />
							</>
						)}
					</>
					<TreeViewPlugin />
				</LexicalComposer>
			</Box>
		</Box>
	);
});
