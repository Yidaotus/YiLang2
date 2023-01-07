import type { Klass, LexicalCommand, LexicalNode } from "lexical";
import { COMMAND_PRIORITY_NORMAL, PASTE_COMMAND } from "lexical";
import {
	COMMAND_PRIORITY_LOW,
	$createParagraphNode,
	$getSelection,
	$createTextNode,
} from "lexical";

import { ListNode, ListItemNode } from "@lexical/list";

import React, { useEffect, useState } from "react";
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
import { $createImageNode, ImageNode } from "./nodes/ImageNode";
import ImagesPlugin from "./plugins/ImagePlugin/ImagePlugin";

import RemarkPlugin from "./plugins/RemarkBlockPlugin";
import { RemarkContainerNode } from "./plugins/RemarkBlockPlugin/RemarkContainerNode";
import { RemarkContentNode } from "./plugins/RemarkBlockPlugin/RemarkContentNode";
import { RemarkTitleNode } from "./plugins/RemarkBlockPlugin/RemarkTitleNode";

import { TreeView } from "@lexical/react/LexicalTreeView";

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
import SaveOnBlurPlugin from "./plugins/SaveOnBlur/SaveOnBlurPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$createImagePargraphContainerNode,
	ImagePargraphContainerNode,
} from "./nodes/ImageParagraphNode/ImageParagraphContainer";

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
	ImagePargraphContainerNode,
];

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: Error) {
	console.error(error);
}

export const SPLIT_PARAGRAPH: LexicalCommand<void> =
	createCommand("SPLIT_PARAGRAPH");

export const INSERT_IMAGE_PARAGRAPH: LexicalCommand<void> = createCommand(
	"INSERT_IMAGE_PARAGRAPH"
);

const TreeViewPlugin = () => {
	const [editor] = useLexicalComposerContext();
	return (
		<TreeView
			viewClassName="tree-view-output"
			timeTravelPanelClassName="debug-timetravel-panel"
			timeTravelButtonClassName="debug-timetravel-button"
			timeTravelPanelSliderClassName="debug-timetravel-panel-slider"
			timeTravelPanelButtonClassName="debug-timetravel-panel-button"
			editor={editor}
		/>
	);
};

const SplitPlugin = () => {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		return editor.registerCommand(
			PASTE_COMMAND,
			(e: ClipboardEvent) => {
				const { clipboardData } = e;
				if (clipboardData && clipboardData.items?.[0]) {
					for (const item of clipboardData.items) {
						console.debug({ item, file: item.getAsFile() });
						const file = item.getAsFile();
						if (!file) continue;
						const src = window.URL.createObjectURL(file);
						console.debug({ src });
					}
				}
				return false;
			},
			COMMAND_PRIORITY_NORMAL
		);
	}, [editor]);

	useEffect(() => {
		return editor.registerCommand(
			SPLIT_PARAGRAPH,
			() => {
				const paragraphNodeLeft = $createParagraphNode().append(
					$createTextNode("test paragraph node Left")
				);
				const paragraphNodeRight = $createParagraphNode().append(
					$createTextNode("test paragraph node Right")
				);
				const imageParagraphContainerNode = $createImagePargraphContainerNode();

				imageParagraphContainerNode.append(
					paragraphNodeLeft,
					paragraphNodeRight
				);

				const selection = $getSelection();
				if (selection) {
					selection.insertNodes([imageParagraphContainerNode]);
				}

				return true;
			},
			COMMAND_PRIORITY_LOW
		);
	}, [editor]);

	return null;
};

const ImageParagraphPlugin = () => {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		return editor.registerCommand(
			INSERT_IMAGE_PARAGRAPH,
			() => {
				const imageNode = $createImageNode({
					altText: "image node",
					src: "https://upload.wikimedia.org/wikipedia/commons/b/bd/Test.svg",
				});
				const paragraphNode = $createParagraphNode().append(
					$createTextNode("test paragraph node!")
				);
				const imageParagraphContainerNode = $createImagePargraphContainerNode();

				imageParagraphContainerNode.append(paragraphNode, imageNode);

				const selection = $getSelection();
				if (selection) {
					selection.insertNodes([imageParagraphContainerNode]);
				}

				return true;
			},
			COMMAND_PRIORITY_LOW
		);
	}, [editor]);

	return null;
};

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
			<Box
				display="flex"
				justifyContent="center"
				w="100%"
				pos="relative"
				flexDir="column"
			>
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
					<RemarkPlugin />
					<HistoryPlugin />
					<PersistStateOnPageChangePlugion documentId={documentId} />
					<FetchDocumentPlugin documentId={documentId} />
					<ImageParagraphPlugin />
					<SplitPlugin />
					<TabIndentationPlugin />
					<ListMaxIndentLevelPlugin maxDepth={4} />
					<GetDocumentTitlePlugin setDocumentTitle={setDocumentTitle} />
					<ListPlugin />
					<ImagesPlugin />
					<SaveOnBlurPlugin documentId={documentId} />
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
					<TreeViewPlugin />
				</LexicalComposer>
			</Box>
		</Box>
	);
});
