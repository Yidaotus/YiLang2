import type { Klass, LexicalNode } from "lexical";
import {
	$addUpdateTag,
	$createParagraphNode,
	$getNodeByKey,
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_NORMAL,
	createCommand,
	KEY_BACKSPACE_COMMAND,
	KEY_DELETE_COMMAND,
	KEY_ENTER_COMMAND,
} from "lexical";

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
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";

import {
	$createDialogueSpeakerNode,
	$createDialogueSpeechNode,
	$isDialogueContainerNode,
	$isDialogueSpeakerNode,
	$isDialogueSpeechNode,
	DialogueContainerNode,
	DialogueSpeakerNode,
	DialogueSpeechNode,
} from "./nodes/Dialogue";

import { ImageNode } from "./nodes/ImageNode";
import { SentenceNode } from "./nodes/Sentence/SentenceNode";
import { WordNode } from "./nodes/WordNode";
import FetchDocumentPlugin from "./plugins/FetchDocumentPlugin/FetchDocumentPlugin";
import ImagesPlugin from "./plugins/ImagePlugin/ImagePlugin";
import PersistStateOnPageChangePlugion from "./plugins/PersistantStateOnPageChangePlugin/PersistantStateOnPageChangePlugin";
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

import useEditorSettingsStore, { useEditorSettingsActions } from "@store/store";
import GetDocumentTitlePlugin from "./plugins/GetDocumentTitlePlugin/GetDocumentTitlePlugin";
import SelectedBlockTypePlugin from "./plugins/SelectedBlockTypePlugin/SelectedBlockTypePlugin";
import SidebarPlugin from "./plugins/SidebarPlugin/SidebarPlugin";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import shallow from "zustand/shallow";
import { SentenceToggleNode } from "./nodes/Sentence/SentenceToggleNode";
import { SplitLayoutColumnNode } from "./nodes/SplitLayout/SplitLayoutColumn";
import { SplitLayoutContainerNode } from "./nodes/SplitLayout/SplitLayoutContainer";
import { WordAnchor } from "./nodes/WordAnchor/WordEditorAnchor";
import { CustomContentEditable } from "./plugins/CustomContentEditable/CustomContentEditable";
import FloatingTextFormatToolbarPlugin from "./plugins/FloatingToolbarPlugin/FloatingToolbarPlugin";
import FloatingWordEditorPlugin from "./plugins/FloatingWordEditor/FloatingWordEditor";
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
import TableOfContentsPlugin from "./plugins/TableOfContentsPlugin";
import TreeViewPlugin from "./plugins/TreeViewPlugin/TreeViewPlugin";
import WordPlugin from "./plugins/WordPlugin/WordPlugin";
import WordPopupPlugin from "./plugins/WordPopupPlugin/WordPopupPlugin";

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
	WordAnchor,
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
		return mergeRegister(
			editor.registerCommand(
				KEY_DELETE_COMMAND,
				(e) => {
					const selection = $getSelection();
					if (
						!selection ||
						!$isRangeSelection(selection) ||
						!selection.isCollapsed()
					)
						return false;

					const target = selection.anchor.getNode();
					const node = $findMatchingParent(target, $isDialogueSpeechNode);
					if (!$isDialogueSpeechNode(node)) return false;

					if (node.getChildrenSize() < 1) {
						node.selectNext();
						node.remove();
						e?.preventDefault();
						return true;
					}
					return false;
				},
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerCommand(
				KEY_BACKSPACE_COMMAND,
				(e) => {
					const selection = $getSelection();
					if (
						!selection ||
						!$isRangeSelection(selection) ||
						!selection.isCollapsed()
					)
						return false;

					const target = selection.anchor.getNode();
					const node = $findMatchingParent(target, $isDialogueSpeechNode);
					if (!$isDialogueSpeechNode(node)) return false;

					if (node.getChildrenSize() < 1) {
						node.selectPrevious();
						node.remove();
						e?.preventDefault();
						return true;
					}
					return false;
				},
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerCommand(
				KEY_ENTER_COMMAND,
				(e) => {
					const selection = $getSelection();
					if (
						!selection ||
						!$isRangeSelection(selection) ||
						!selection.isCollapsed()
					)
						return false;

					const target = selection.anchor.getNode();
					const node = $findMatchingParent(target, $isDialogueSpeakerNode);
					if (!$isDialogueSpeakerNode(node)) return false;

					node.selectNext();
					e?.preventDefault();
					return true;
				},
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerCommand(
				KEY_ENTER_COMMAND,
				(e) => {
					const selection = $getSelection();
					if (
						!selection ||
						!$isRangeSelection(selection) ||
						!selection.isCollapsed()
					)
						return false;

					const target = selection.anchor.getNode();
					const node = $findMatchingParent(target, $isDialogueSpeechNode);
					if (!$isDialogueSpeechNode(node)) return false;

					const parent = node.getParent();
					if (!$isDialogueContainerNode(parent)) return false;

					const parentIndex = node.getIndexWithinParent();

					if (node.getChildrenSize() < 1) {
						const sibling = node.getNextSibling();
						if ($isDialogueSpeakerNode(sibling)) {
							sibling.selectStart();
						} else {
							parent.insertAfter($createParagraphNode());
							parent.selectNext();
							node.remove();
						}
					} else {
						const speechNode = $createDialogueSpeechNode();
						const speakerNode = $createDialogueSpeakerNode();
						parent.splice(parentIndex + 1, 0, [speakerNode, speechNode]);
						speakerNode.select();
					}
					e?.preventDefault();
					return true;
				},
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerMutationListener(DialogueContainerNode, (updates) => {
				editor.update(() => {
					for (const [nodeKey, mutation] of updates) {
						const node = $getNodeByKey(nodeKey);
						if (!$isDialogueContainerNode(node)) continue;

						if (node.getChildrenSize() < 1) {
							node.remove();
							continue;
						}

						for (const child of node.getChildren()) {
							if (
								!$isDialogueSpeakerNode(child) &&
								!$isDialogueSpeechNode(child)
							) {
								node.insertAfter(child);
							}
						}
					}
				});
			}),
			editor.registerMutationListener(DialogueSpeechNode, (updates) => {
				editor.update(() => {
					for (const [nodeKey, mutation] of updates) {
						const node = $getNodeByKey(nodeKey);
						if (!$isDialogueSpeechNode(node)) continue;

						const parent = node.getParent();
						if (parent && !$isDialogueContainerNode(parent)) {
							const content = node.getChildren();
							const index = node.getIndexWithinParent();

							parent.splice(index, 1, content);
						}
						if (!parent) {
							node.selectPrevious();
							node.remove();
						}
					}
				});
			}),
			editor.registerMutationListener(DialogueSpeakerNode, (updates) => {
				editor.update(() => {
					for (const [nodeKey, mutation] of updates) {
						$addUpdateTag("history-merge");
						const node = $getNodeByKey(nodeKey);
						if (!$isDialogueSpeakerNode(node)) continue;

						const parent = node.getParent();
						if (parent && !$isDialogueContainerNode(parent)) {
							const content = node.getChildren();
							const index = node.getIndexWithinParent();

							parent.splice(index, 1, content);
						}
						if (!parent) {
							node.remove();
						}

						const nextSibling = node.getNextSibling();
						if (!$isDialogueSpeechNode(nextSibling)) {
							node.remove();
						}
					}
				});
			})
		);
	}, [editor]);

	return null;
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
	const { setEditorSelectedBlock } = useEditorSettingsActions();

	const { editorFontSize, editorLineHeight, editorShowSpelling } =
		useEditorSettingsStore(
			(state) => ({
				editorFontSize: state.editorFontSize,
				editorLineHeight: state.editorLineHeight,
				editorShowSpelling: state.editorShowSpelling,
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
		<Box display="flex" justifyContent="center" pos="relative" flexDir="column">
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
								id="editor-container"
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
					setSelectedBlockType={setEditorSelectedBlock}
				/>
				<DebugPlugin />
				<>
					{scrollAnchor && sidebarPortal && (
						<>
							{/* <MinimapPlugin
								anchorElem={scrollAnchor}
								sidebarPortal={sidebarPortal}
							/> */}
							<TableOfContentsPlugin
								anchorElem={scrollAnchor}
								sidebarPortal={sidebarPortal}
							/>
							<SidebarPlugin sidebarPortal={sidebarPortal} />
						</>
					)}
					{!isSemiReadOnly && floatingAnchorElem && (
						<>
							<FloatingTextFormatToolbarPlugin
								anchorElem={floatingAnchorElem}
								documentId={documentId}
							/>
							<FloatingWordEditorPlugin
								documentId={documentId}
								anchorElem={floatingAnchorElem}
							/>
						</>
					)}
					{floatingAnchorElem && (
						<>
							<ImageMenuPlugin anchorElem={floatingAnchorElem} />
							<SentenceMenuPlugin anchorElem={floatingAnchorElem} />
							<WordPopupPlugin anchorElem={floatingAnchorElem} />
							<SentencePopupPlugin anchorElem={floatingAnchorElem} />
						</>
					)}
				</>
				<TreeViewPlugin />
			</LexicalComposer>
		</Box>
	);
});
