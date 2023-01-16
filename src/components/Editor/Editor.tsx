import type { Klass, LexicalNode } from "lexical";
import {
	$createParagraphNode,
	$createTextNode,
	$getAdjacentNode,
	$getNodeByKey,
	$getSelection,
	$isDecoratorNode,
	$isElementNode,
	$isRangeSelection,
	$isTextNode,
	COMMAND_PRIORITY_LOW,
	KEY_BACKSPACE_COMMAND,
	KEY_ENTER_COMMAND,
} from "lexical";

import { Box, useBreakpointValue } from "@chakra-ui/react";
import { ListItemNode, ListNode } from "@lexical/list";

import { $isListItemNode } from "@lexical/list";
import React, { useEffect, useState } from "react";

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
import { $isSentenceNode, SentenceNode } from "./nodes/Sentence/SentenceNode";
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
import {
	$createSentenceToggleNode,
	$isSentenceToggleNode,
	SentenceToggleNode,
} from "./nodes/Sentence/SentenceToggleNode";
import { SplitLayoutColumnNode } from "./nodes/SplitLayout/SplitLayoutColumn";
import { SplitLayoutContainerNode } from "./nodes/SplitLayout/SplitLayoutContainer";
import BlockSelectPopupPlugin from "./plugins/BlockSelectPopup/BlockSelectPopupPlugin";
import { CustomContentEditable } from "./plugins/CustomContentEditable/CustomContentEditable";
import GrammarPointPlugin from "./plugins/GrammarPointPlugin/GrammarPointPlugin";
import ImageMenuPlugin from "./plugins/ImageMenuPlugin/ImageMenuPlugin";
import PasteImageFromClipboardPlugin from "./plugins/PasteImageFromClipboardPlugin/PasteImageFromClipboardPlugin";
import SaveImagesPlugin from "./plugins/SaveImagesPlugin/SaveImagesPlugin";
import SaveOnBlurPlugin from "./plugins/SaveOnBlur/SaveOnBlurPlugin";
import SaveToDBPlugin from "./plugins/SaveToDBPlugin/SaveToDBPlugin";
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

const DialoguePlugin = () => {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		return mergeRegister(
			editor.registerMutationListener(SentenceToggleNode, (updates) => {
				editor.update(() => {
					for (const [nodeKey] of updates) {
						const node = $getNodeByKey(nodeKey);
						if (!$isSentenceToggleNode(node)) return;

						const parent = node.getParent();
						if (!parent || !$isSentenceNode(parent)) {
							node.remove();
						}
					}
				});
			}),
			editor.registerMutationListener(SentenceNode, (updates) => {
				editor.update(() => {
					for (const [nodeKey, mutation] of updates) {
						const node = $getNodeByKey(nodeKey);
						if (!$isSentenceNode(node)) return;

						// Node should always have a toggle node
						const lastChild = node.getLastChild();
						if (mutation === "created" || mutation === "updated") {
							if (!lastChild || !$isSentenceToggleNode(lastChild)) {
								const toggle = $createSentenceToggleNode();
								node.append(toggle);
							}
						}

						// Node cannot be empty. Empty is anything less than 2 childs, because of our toggle node
						if (node.getChildrenSize() < 2) {
							node.remove();
						}

						// Rrevent nesting
						const parent = node.getParent();
						if (!parent) return;

						const parentSentence = $findMatchingParent(parent, $isSentenceNode);
						if (parentSentence) {
							parentSentence.insertAfter(node);
						}
					}
				});
			}),
			editor.registerCommand(
				KEY_BACKSPACE_COMMAND,
				() => {
					const selection = $getSelection();
					if (!selection || !$isRangeSelection(selection)) return false;

					const adjNode = $getAdjacentNode(selection.anchor, true);

					if ($isSentenceToggleNode(adjNode)) {
						const sentenceNode = $getNodeByKey(adjNode.getSentenceNodeKey());
						if (!$isSentenceNode(sentenceNode)) return false;

						sentenceNode.selectEnd();
						return true;
					}

					return false;
				},
				COMMAND_PRIORITY_LOW
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

					const speechNode = $findMatchingParent(
						selection.anchor.getNode(),
						$isDialogueSpeechNode
					);

					if (!$isDialogueSpeechNode(speechNode)) return false;

					const newSpeakerNode = $createDialogueSpeakerNode();
					const newSpechNode = $createDialogueSpeechNode();
					speechNode.insertAfter(newSpechNode);
					speechNode.insertAfter(newSpeakerNode);
					newSpeakerNode.select();
					e?.preventDefault();
					return true;
				},
				COMMAND_PRIORITY_LOW
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

					const speakerNode = $findMatchingParent(
						selection.anchor.getNode(),
						$isDialogueSpeakerNode
					);

					if (!$isDialogueSpeakerNode(speakerNode)) return false;

					const prevSibling = speakerNode.getPreviousSibling();
					const nextSibling = speakerNode.getNextSibling();
					if (prevSibling && speakerNode.getChildrenSize() < 1) {
						if ($isElementNode(prevSibling)) {
							prevSibling.selectEnd();
						}
						if (
							!$isDialogueSpeechNode(nextSibling) ||
							nextSibling.getChildrenSize() < 1
						) {
							nextSibling?.remove();
							speakerNode.remove();
							e?.preventDefault();
						}
						return true;
					}
					return false;
				},
				COMMAND_PRIORITY_LOW
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

					const speakerNode = $findMatchingParent(
						selection.anchor.getNode(),
						$isDialogueSpeakerNode
					);

					if (!$isDialogueSpeakerNode(speakerNode)) return false;

					const sibling = speakerNode.getNextSibling();
					if (!$isDialogueSpeechNode(sibling)) {
						const newSpeechNode = $createDialogueSpeechNode().append(
							$createTextNode("")
						);
						speakerNode.insertAfter(newSpeechNode);
						newSpeechNode.select();
						e?.preventDefault();
						return true;
					} else {
						const children = speakerNode.getChildren();

						if (children.length > 0) {
							sibling.selectStart();
							e?.preventDefault();
							return true;
						}

						const parent = speakerNode.getParent();
						if (!$isDialogueContainerNode(parent)) return false;

						if (parent.getLastChild() === sibling) {
							const newParagraph = $createParagraphNode();
							parent.insertAfter(newParagraph);
							newParagraph.select();

							speakerNode.remove();
							sibling.remove();

							e?.preventDefault();
							return true;
						}
					}
					return false;
				},
				COMMAND_PRIORITY_LOW
			),
			editor.registerMutationListener(DialogueContainerNode, (nodes) => {
				editor.update(() => {
					for (const [nodeKey, mutation] of nodes) {
						if (mutation === "updated") {
							const node = $getNodeByKey(nodeKey);
							if (!$isDialogueContainerNode(node)) return false;

							const children = node.getChildren();

							let index = 0;
							for (const child of children) {
								const shouldBeSpeech = !!(index % 2);
								const shouldBeSpeaker = !shouldBeSpeech;

								if (shouldBeSpeaker && !$isDialogueSpeakerNode(child)) {
									const speakerNode = $createDialogueSpeakerNode();

									let content: Array<LexicalNode>;
									if ($isElementNode(child)) {
										content = child.getChildren();
									} else {
										content = [$createTextNode(child.getTextContent())];
									}

									speakerNode.append(...content);
									child.replace(speakerNode);
								}

								if (shouldBeSpeech && !$isDialogueSpeechNode(child)) {
									const speechNode = $createDialogueSpeechNode();

									let content: Array<LexicalNode>;
									if ($isElementNode(child)) {
										content = child.getChildren();
									} else {
										content = [$createTextNode(child.getTextContent())];
									}

									speechNode.append(...content);
									child.replace(speechNode);
								}

								index++;
							}
						}
					}
				});
			}),
			editor.registerMutationListener(DialogueSpeechNode, (nodes) => {
				editor.update(() => {
					for (const [nodeKey, mutation] of nodes) {
						if (mutation === "updated" || mutation === "created") {
							const node = $getNodeByKey(nodeKey);
							if (!$isDialogueSpeechNode(node)) return false;

							const parent = node.getParent();
							if (!$isDialogueContainerNode(parent)) {
								node.remove();
							}

							const children = node.getChildren();

							if (children.length < 0) {
								const sibling = node.getPreviousSibling();
								if ($isDialogueSpeakerNode(sibling)) {
									sibling.selectEnd();
								} else {
									node.selectPrevious();
								}
								node.remove();
							}

							for (const child of children) {
								if ($isTextNode(child)) {
									continue;
								}

								if (
									$isElementNode(child) &&
									child.isInline() &&
									!$isListItemNode(child)
								) {
									continue;
								}

								if ($isDecoratorNode(child) && child.isInline()) {
									continue;
								}

								const text = child.getTextContent();
								child.insertAfter($createTextNode(text));
								child.remove();
							}
						}
					}
				});
			}),
			editor.registerMutationListener(DialogueSpeakerNode, (nodes) => {
				editor.update(() => {
					for (const [nodeKey, mutation] of nodes) {
						if (mutation === "updated" || mutation === "created") {
							const node = $getNodeByKey(nodeKey);
							if (!$isDialogueSpeakerNode(node)) return false;

							const parent = node.getParent();
							if (!$isDialogueContainerNode(parent)) {
								node.remove();
							}

							const children = node.getChildren();

							if (children.length < 0) {
								const sibling = node.getPreviousSibling();
								if ($isDialogueSpeechNode(sibling)) {
									sibling.selectEnd();
								} else {
									node.selectPrevious();
								}
								node.remove();
							}

							for (const child of children) {
								if ($isTextNode(child)) {
									continue;
								}

								if ($isElementNode(child) && child.isInline()) {
									continue;
								}

								if ($isDecoratorNode(child) && child.isInline()) {
									continue;
								}

								const text = child.getTextContent();
								child.replace($createTextNode(text));
							}
						}
					}
				});
			})
		);
	}, [editor]);

	return null;
};

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
					<DialoguePlugin />
					<SaveOnBlurPlugin />
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
