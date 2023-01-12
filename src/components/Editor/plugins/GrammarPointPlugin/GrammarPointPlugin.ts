import type { ElementNode, NodeKey, TextNode } from "lexical";
import { $isTextNode, KEY_ENTER_COMMAND } from "lexical";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
	$createParagraphNode,
	$createTextNode,
	$getNearestRootOrShadowRoot,
	$getNodeByKey,
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_EDITOR,
	COMMAND_PRIORITY_LOW,
	createCommand,
	DELETE_CHARACTER_COMMAND,
	KEY_ARROW_DOWN_COMMAND,
} from "lexical";
import { useEffect } from "react";
import {
	$createGrammarPointContainerNode,
	$isGrammarPointContainerNode,
	GrammarPointContainerNode,
} from "../../nodes/GrammarPoint/GrammarPointContainerNode";
import {
	$createGrammarPointContentNode,
	$isGrammarPointContentNode,
	GrammarPointContentNode,
} from "../../nodes/GrammarPoint/GrammarPointContentNode";
import {
	$createGrammarPointTitleNode,
	$isGrammarPointTitleNode,
	GrammarPointTitleNode,
} from "../../nodes/GrammarPoint/GrammarPointTitleNode";

export const INSERT_REMARK_COMMAND = createCommand<string>();
export const TOGGLE_REMARK_COMMAND = createCommand<NodeKey>();

export default function GrammarPointPlugin(): JSX.Element | null {
	const [editor] = useLexicalComposerContext();
	useEffect(() => {
		if (
			!editor.hasNodes([
				GrammarPointContainerNode,
				GrammarPointTitleNode,
				GrammarPointContentNode,
			])
		) {
			throw new Error(
				"GrammarPointPlugin: GrammarPointContainerNode, GrammarPointTitleNode, or GrammarPointContentNode not registered on editor"
			);
		}

		return mergeRegister(
			// Structure enforcing transformers for each node type. In case nesting structure is not
			// "Container > Title + Content" it'll unwrap nodes and convert it back
			// to regular content.
			editor.registerNodeTransform(GrammarPointContentNode, (node) => {
				const parent = node.getParent();
				if (!$isGrammarPointContainerNode(parent)) {
					const children = node.getChildren();
					for (const child of children) {
						node.insertBefore(child);
					}
					node.remove();
				}
			}),
			editor.registerNodeTransform(GrammarPointTitleNode, (node) => {
				const parent = node.getParent();
				if (!$isGrammarPointContainerNode(parent)) {
					node.replace($createParagraphNode());
				}
			}),
			editor.registerNodeTransform(GrammarPointContainerNode, (node) => {
				const children = node.getChildren();
				if (
					children.length !== 2 ||
					!$isGrammarPointTitleNode(children[0]) ||
					!$isGrammarPointContentNode(children[1])
				) {
					for (const child of children) {
						node.insertBefore(child);
					}
					node.remove();
				}

				const parent = node.getParent();
				if (!parent) return;
				if (parent != $getNearestRootOrShadowRoot(node)) {
					parent.insertAfter(node);
				}
			}),
			// This handles the case when container is collapsed and we delete its previous sibling
			// into it, it would cause collapsed content deleted (since it's display: none, and selection
			// swallows it when deletes single char). Instead we expand container, which is although
			// not perfect, but avoids bigger problem
			editor.registerCommand(
				DELETE_CHARACTER_COMMAND,
				() => {
					const selection = $getSelection();
					if (
						!$isRangeSelection(selection) ||
						!selection.isCollapsed() ||
						selection.anchor.offset !== 0
					) {
						return false;
					}

					const anchorNode = selection.anchor.getNode();
					const topLevelElement = anchorNode.getTopLevelElement();
					if (topLevelElement === null) {
						return false;
					}

					const container = topLevelElement.getPreviousSibling();
					if (!$isGrammarPointContainerNode(container) || container.getOpen()) {
						return false;
					}

					container.setOpen(true);
					return true;
				},
				COMMAND_PRIORITY_LOW
			),
			// When collapsible is the last child pressing down arrow will insert paragraph
			// below it to allow adding more content. It's similar what $insertBlockNode
			// (mainly for decorators), except it'll always be possible to continue adding
			// new content even if trailing paragraph is accidentally deleted
			editor.registerCommand(
				KEY_ARROW_DOWN_COMMAND,
				() => {
					const selection = $getSelection();
					if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
						return false;
					}

					const container = $findMatchingParent(
						selection.anchor.getNode(),
						$isGrammarPointContainerNode
					);

					if (!$isGrammarPointContainerNode(container)) {
						return false;
					}

					const parent = container.getParent();
					if (parent !== null && parent.getLastChild() === container) {
						parent.append($createParagraphNode());
					}
					return false;
				},
				COMMAND_PRIORITY_LOW
			),
			// Handling CMD+Enter to toggle collapsible element collapsed state
			editor.registerCommand(
				INSERT_REMARK_COMMAND,
				(payload) => {
					editor.update(() => {
						const selection = $getSelection();

						if (!$isRangeSelection(selection)) {
							return;
						}

						const title = $createGrammarPointTitleNode();
						const content = $createGrammarPointContentNode().append(
							$createParagraphNode().append($createTextNode(payload))
						);
						const container = $createGrammarPointContainerNode().append(
							title,
							content
						);
						selection.insertNodes([container]);
						content.selectStart();
					});

					return true;
				},
				COMMAND_PRIORITY_EDITOR
			),
			editor.registerCommand(
				TOGGLE_REMARK_COMMAND,
				(key: NodeKey) => {
					editor.update(() => {
						const containerNode = $getNodeByKey(key);
						if ($isGrammarPointContainerNode(containerNode)) {
							containerNode.toggleOpen();
						}
					});

					return true;
				},
				COMMAND_PRIORITY_EDITOR
			),
			editor.registerCommand(
				KEY_ENTER_COMMAND,
				(e) => {
					const selection = $getSelection();
					if (!$isRangeSelection(selection) || !selection.isCollapsed())
						return false;

					let anchorNode: ElementNode | TextNode | null =
						selection.anchor.getNode();
					if ($isTextNode(anchorNode)) {
						anchorNode = anchorNode.getParent();
					}

					if (!anchorNode) return false;
					if (anchorNode.getTextContentSize() > 0) {
						return false;
					}

					const remarkContent = $findMatchingParent(
						anchorNode,
						$isGrammarPointContentNode
					);
					if (!$isGrammarPointContentNode(remarkContent)) return false;

					const targetChild = remarkContent.getLastChild();
					if (!targetChild) return false;

					if (anchorNode !== targetChild) return false;

					if (selection.anchor.offset < targetChild.getTextContentSize())
						return false;

					const remarkContainer = remarkContent.getParent();
					if (!remarkContainer) return false;

					const newTextNode = $createTextNode("");
					const newParagraph = $createParagraphNode().append(newTextNode);
					remarkContainer.insertAfter(newParagraph, false);
					newTextNode.select();
					anchorNode.remove();
					e?.preventDefault();
					return true;
				},
				COMMAND_PRIORITY_LOW
			)
		);
	}, [editor]);
	return null;
}
