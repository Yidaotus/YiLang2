import {
	$isSentenceNode,
	SentenceNode,
} from "@components/Editor/nodes/Sentence/SentenceNode";
import {
	$createSentenceToggleNode,
	$isSentenceToggleNode,
} from "@components/Editor/nodes/Sentence/SentenceToggleNode";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
	$addUpdateTag,
	$createTextNode,
	$getNodeByKey,
	$isTextNode,
} from "lexical";
import { useEffect, useRef } from "react";

const SentencePlugin = () => {
	const [editor] = useLexicalComposerContext();
	const isInNodePrevious = useRef(false);

	useEffect(() => {
		return mergeRegister(
			editor.registerMutationListener(SentenceNode, (updates) => {
				editor.update(() => {
					$addUpdateTag("history-merge");
					for (const [nodeKey, mutation] of updates) {
						const node = $getNodeByKey(nodeKey);
						if (!$isSentenceNode(node)) continue;

						// Node should always have a toggle node
						const lastChild = node.getLastChild();
						if (mutation === "created" || mutation === "updated") {
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

							const shouldBeToken = node.getLastChild();
							if (!shouldBeToken) continue;
							const shouldBeToggle = shouldBeToken.getPreviousSibling();

							for (const child of node.getChildren()) {
								if (
									$isTextNode(child) &&
									child.getMode() === "token" &&
									child !== shouldBeToken
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
			})
		);
	}, [editor]);

	return null;
};

export default SentencePlugin;
