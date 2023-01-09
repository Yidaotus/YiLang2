/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import type { NodeKey } from "lexical";
import { $createTextNode } from "lexical";
import {
	$createParagraphNode,
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
	$createRemarkContainerNode,
	$isRemarkContainerNode,
	RemarkContainerNode,
} from "./RemarkContainerNode";
import {
	$createRemarkContentNode,
	$isRemarkContentNode,
	RemarkContentNode,
} from "./RemarkContentNode";
import {
	$createRemarkTitleNode,
	$isRemarkTitleNode,
	RemarkTitleNode,
} from "./RemarkTitleNode";

export const INSERT_REMARK_COMMAND = createCommand<string>();
export const TOGGLE_REMARK_COMMAND = createCommand<NodeKey>();

export default function RemarkPlugin(): JSX.Element | null {
	const [editor] = useLexicalComposerContext();
	useEffect(() => {
		if (
			!editor.hasNodes([
				RemarkContainerNode,
				RemarkTitleNode,
				RemarkContentNode,
			])
		) {
			throw new Error(
				"CollapsiblePlugin: CollapsibleContainerNode, CollapsibleTitleNode, or CollapsibleContentNode not registered on editor"
			);
		}

		return mergeRegister(
			// Structure enforcing transformers for each node type. In case nesting structure is not
			// "Container > Title + Content" it'll unwrap nodes and convert it back
			// to regular content.
			editor.registerNodeTransform(RemarkContentNode, (node) => {
				const parent = node.getParent();
				if (!$isRemarkContainerNode(parent)) {
					const children = node.getChildren();
					for (const child of children) {
						node.insertBefore(child);
					}
					node.remove();
				}
			}),
			editor.registerNodeTransform(RemarkTitleNode, (node) => {
				const parent = node.getParent();
				if (!$isRemarkContainerNode(parent)) {
					node.replace($createParagraphNode());
				}
			}),
			editor.registerNodeTransform(RemarkContainerNode, (node) => {
				const children = node.getChildren();
				if (
					children.length !== 2 ||
					!$isRemarkTitleNode(children[0]) ||
					!$isRemarkContentNode(children[1])
				) {
					for (const child of children) {
						node.insertBefore(child);
					}
					node.remove();
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
					if (!$isRemarkContainerNode(container) || container.getOpen()) {
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
						$isRemarkContainerNode
					);

					if (!$isRemarkContainerNode(container)) {
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

						const title = $createRemarkTitleNode();
						const content = $createRemarkContentNode().append(
							$createParagraphNode().append($createTextNode(payload))
						);
						const container = $createRemarkContainerNode().append(
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
						if ($isRemarkContainerNode(containerNode)) {
							containerNode.toggleOpen();
						}
					});

					return true;
				},
				COMMAND_PRIORITY_EDITOR
			)
		);
	}, [editor]);
	return null;
}
