import { HIGHLIGHT_NODE_COMMAND } from "@components/Editor/Editor";
import type { SentenceNode } from "@components/Editor/nodes/Sentence/SentenceNode";
import {
	$createSentenceNode,
	$isSentenceNode,
} from "@components/Editor/nodes/Sentence/SentenceNode";
import { $isSentenceToggleNode } from "@components/Editor/nodes/Sentence/SentenceToggleNode";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import { $getAncestor } from "@utils/utils";
import type { ElementNode, LexicalNode } from "lexical";
import {
	$createTextNode,
	$getNodeByKey,
	$getRoot,
	$getSelection,
	$isElementNode,
	$isRangeSelection,
	$isTextNode,
	COMMAND_PRIORITY_NORMAL,
	createCommand,
	KEY_ARROW_LEFT_COMMAND,
	KEY_ARROW_RIGHT_COMMAND,
	KEY_BACKSPACE_COMMAND,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useCallback, useEffect, useState } from "react";
import { $getAllNodesOfType } from "../SaveToDBPlugin/SaveToDBPlugin";
import highlighStyles from "./SentenceHighlight.module.scss";

export const INSERT_SENTENCE_COMMAND = createCommand<void>(
	"INSER_SENTENCE_COMMAND"
);

const SentencePlugin = () => {
	const [editor] = useLexicalComposerContext();
	const [markedNodes, setMarkedNodes] = useState(new Set<string>());

	const markSentences = useCallback(
		(nodes: Array<LexicalNode>) => {
			const newMarkers = new Set<string>();
			for (const node of nodes) {
				const sentenceParent = $findMatchingParent(node, $isSentenceNode);
				if (sentenceParent) {
					const sentenceParentKey = sentenceParent.getKey();
					if (newMarkers.has(sentenceParentKey)) continue;
					const domElement = editor.getElementByKey(sentenceParentKey);
					if (!domElement) continue;

					domElement.classList.add(highlighStyles.HighlightedSentence || "");
					newMarkers.add(sentenceParentKey);
				}
			}

			for (const previousMarker of markedNodes) {
				if (!newMarkers.has(previousMarker)) {
					const domElement = editor.getElementByKey(previousMarker);
					if (!domElement) continue;

					domElement.classList.remove(highlighStyles.HighlightedSentence || "");
				}
			}

			setMarkedNodes(newMarkers);
		},
		[editor, markedNodes]
	);

	const markActiveSentence = useCallback(() => {
		const selection = $getSelection();
		if (!selection) return false;

		const nodes = selection.getNodes();
		markSentences(nodes);

		return false;
	}, [markSentences]);

	const insertSentence = useCallback(() => {
		const translation = "This is just a simple test!";
		const selection = $getSelection();

		if (!$isRangeSelection(selection)) {
			return false;
		}
		const nodes = selection.extract();

		if (nodes.length === 1) {
			const firstNode = nodes[0] as LexicalNode;
			const sentenceNode = $isSentenceNode(firstNode)
				? firstNode
				: $getAncestor(firstNode, (node) => $isSentenceNode(node));
			if ($isSentenceNode(sentenceNode)) {
				for (const child of sentenceNode.getChildren()) {
					if (
						!$isSentenceToggleNode(child) &&
						!($isTextNode(child) && child.getMode() === "token")
					) {
						sentenceNode.insertBefore(child);
					}
				}
				sentenceNode.remove();
				return false;
			}
		}

		let prevParent: ElementNode | SentenceNode | null = null;
		let sentenceNode: SentenceNode | null = null;

		for (const node of nodes) {
			const parent = node.getParent();

			if (
				parent === sentenceNode ||
				parent === null ||
				($isElementNode(node) && !node.isInline())
			) {
				continue;
			}

			if ($isSentenceNode(parent)) {
				sentenceNode = parent;
				parent.setTranslation(translation);
				continue;
			}

			if (!parent.is(prevParent)) {
				prevParent = parent;
				sentenceNode = $createSentenceNode(translation, null, true);

				if ($isSentenceNode(parent)) {
					if (node.getPreviousSibling() === null) {
						parent.insertBefore(sentenceNode);
					} else {
						parent.insertAfter(sentenceNode);
					}
				} else {
					node.insertBefore(sentenceNode);
				}
			}

			if ($isSentenceNode(node)) {
				if (node.is(sentenceNode)) {
					continue;
				}
				if (sentenceNode !== null) {
					const children = node.getChildren();
					sentenceNode.append(...children);
				}

				node.remove();
				continue;
			}

			if (sentenceNode !== null) {
				sentenceNode.append(node);
			}
		}

		if (!sentenceNode) return false;
		sentenceNode.select();
		return true;
	}, [editor]);

	const highlightSentence = useCallback(
		(key: string) => {
			let nodeKey = key;
			let nodeElem = editor.getElementByKey(nodeKey);
			if (!nodeElem) {
				const sentenceNodes = $getAllNodesOfType($getRoot(), $isSentenceNode);
				for (const sentence of sentenceNodes) {
					if (sentence.getDatabaseId() === key) {
						nodeElem = editor.getElementByKey(sentence.getKey());
						nodeKey = sentence.getKey();
						break;
					}
				}
			}
			if (nodeElem) {
				nodeElem.scrollIntoView({
					block: "center",
					inline: "nearest",
				});
				const node = $getNodeByKey(nodeKey);
				if ($isSentenceNode(node)) {
					node.selectStart();
				}
				return true;
			}

			return false;
		},
		[editor]
	);

	useEffect(() => {
		return mergeRegister(
			editor.registerCommand(
				INSERT_SENTENCE_COMMAND,
				insertSentence,
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerCommand(
				HIGHLIGHT_NODE_COMMAND,
				highlightSentence,
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				markActiveSentence,
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerCommand(
				KEY_BACKSPACE_COMMAND,
				() => {
					const selection = $getSelection();
					if (
						!selection ||
						!$isRangeSelection(selection) ||
						!selection.isCollapsed()
					)
						return false;

					const prevAnchor = selection.anchor.getNode();
					selection.modify("move", true, "character");
					const anchor = selection.anchor.getNode();
					if (!$isSentenceNode(prevAnchor) && $isSentenceNode(anchor)) {
						return true;
					} else {
						selection.modify("move", false, "character");
						return false;
					}
				},
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerCommand(
				KEY_ARROW_LEFT_COMMAND,
				() => {
					const selection = $getSelection();
					if (
						!selection ||
						!$isRangeSelection(selection) ||
						!selection.isCollapsed()
					)
						return false;

					const parent = $findMatchingParent(
						selection.anchor.getNode(),
						$isSentenceNode
					);
					if (!$isSentenceNode(parent)) return false;

					const targetNode = selection.anchor.getNode();
					if (targetNode !== parent.getFirstChild()) return false;

					if (selection.anchor.offset !== 0) return false;

					const parentSibling = parent.getPreviousSibling();
					if (!parentSibling) {
						parent.insertBefore($createTextNode(" "));
					}
					return true;
				},
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerCommand(
				KEY_ARROW_RIGHT_COMMAND,
				() => {
					const selection = $getSelection();
					if (
						!selection ||
						!$isRangeSelection(selection) ||
						!selection.isCollapsed()
					)
						return false;

					const parent = $findMatchingParent(
						selection.anchor.getNode(),
						$isSentenceNode
					);
					if (!$isSentenceNode(parent)) return false;

					const targetNode = selection.anchor.getNode();
					if (targetNode !== parent.getLastChild()) return false;

					if (selection.anchor.offset !== targetNode.getTextContentSize())
						return false;

					const parentSibling = parent.getNextSibling();
					if (!parentSibling) {
						parent.insertAfter($createTextNode(" "));
					}
					return true;
				},
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerUpdateListener(() => {
				editor.getEditorState().read(() => {
					markActiveSentence();
				});
			})
			/*
			editor.registerMutationListener(SentenceNode, (updates) => {
				editor.update(() => {
					$addUpdateTag("history-merge");
					for (const [nodeKey, mutation] of updates) {
						const node = $getNodeByKey(nodeKey);
						if (!$isSentenceNode(node)) continue;

						const firstChild = node.getFirstChild();
						if (!firstChild || !$isDecoratorNode(firstChild)) return;

						firstChild.insertBefore($createTextNode(" "));
					}
				});
			})
			editor.registerMutationListener(SentenceNode, (updates) => {
				editor.update(() => {
					$addUpdateTag("history-merge");
					for (const [nodeKey, mutation] of updates) {
						const node = $getNodeByKey(nodeKey);
						if (!$isSentenceNode(node)) continue;

						// Node should always have a toggle node
						const lastChild = node.getLastChild();
						const firstChild = node.getFirstChild();
						if (mutation === "created" || mutation === "updated") {
							if (
								!firstChild ||
								!$isTextNode(firstChild) ||
								firstChild.getMode() !== "token"
							) {
								node.splice(0, 0, [$createTextNode(" ").setMode("token")]);
							}

							if (!lastChild) {
								node.append($createSentenceToggleNode());
								node.append($createTextNode("").setMode("token"));
							} else {
								const prevSibling = lastChild.getPreviousSibling();
								const lastChildSiblingIsToggle =
									prevSibling &&
									$isSentenceToggleNode(lastChild.getPreviousSibling());

								if (!lastChildSiblingIsToggle) {
									const toggle = $createSentenceToggleNode();
									if (prevSibling) {
										prevSibling.insertAfter(toggle);
									} else {
										node.append(toggle);
									}
								}

								const lastChildIsToken =
									$isTextNode(lastChild) && lastChild.getMode() === "token";
								if (!lastChildIsToken) {
									node.append($createTextNode("").setMode("token"));
								}
							}

							const shouldBeLastToken = node.getLastChild();
							const shouldBeFirstToken = node.getFirstChild();
							if (!shouldBeFirstToken || !shouldBeLastToken) continue;
							const shouldBeToggle = shouldBeLastToken.getPreviousSibling();

							for (const child of node.getChildren()) {
								if (
									$isTextNode(child) &&
									child.getMode() === "token" &&
									child !== shouldBeFirstToken &&
									child !== shouldBeLastToken
								) {
									child.remove();
								}

								if ($isSentenceToggleNode(child) && child !== shouldBeToggle) {
									child.remove();
								}
							}
						}

						// Node cannot be empty. Empty is anything less than 2 childs, because of our toggle node
						if (node.getChildrenSize() < 3) {
							node.remove();
						}

						// Rrevent nesting
						const parent = node.getParent();
						if (!parent) continue;

						const parentSentence = $findMatchingParent(parent, $isSentenceNode);
						if (parentSentence) {
							parentSentence.insertAfter(node);
						}
					}
				});
			})*/
		);
	}, [editor, markActiveSentence]);

	return null;
};

export default SentencePlugin;
