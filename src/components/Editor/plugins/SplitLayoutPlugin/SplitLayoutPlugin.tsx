import type { ElementNode, TextNode } from "lexical";

import {
	$createSplitLayoutColumnNode,
	$isSplitLayoutColumnNode,
	SplitLayoutColumnNode,
} from "@components/Editor/nodes/SplitLayout/SplitLayoutColumn";
import {
	$createSplitLayoutContainerNode,
	$isSplitLayoutContainerNode,
	SplitLayoutContainerNode,
} from "@components/Editor/nodes/SplitLayout/SplitLayoutContainer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$getSelection,
	$isDecoratorNode,
	$isLeafNode,
	$isRangeSelection,
	$isTextNode,
	COMMAND_PRIORITY_LOW,
	createCommand,
	KEY_ARROW_UP_COMMAND,
	KEY_ENTER_COMMAND,
} from "lexical";
import { useEffect } from "react";

export const SWAP_SPLIT_COLUMNS = createCommand<void>("SWAP_SPLIT_COLUMNS");
export const SET_LAYOUT_MODE_SPLIT = createCommand<void>(
	"SET_LAYOUT_MODE_SPLIT"
);
export const SET_LAYOUT_MODE_FULL = createCommand<void>("SET_LAYOUT_MODE_FULL");

const SplitLayoutPlugin = () => {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		if (!editor.hasNodes([SplitLayoutContainerNode, SplitLayoutColumnNode])) {
			throw new Error(
				"SplitLayoutPlugin: SplitLayoutContainerNode and SplitLayoutColumnNode not registered on editor"
			);
		}

		return mergeRegister(
			editor.registerNodeTransform(SplitLayoutColumnNode, (node) => {
				const children = node.getChildren();
				const childrenSize = children.length;
				const lastChild = children[childrenSize - 1];

				//make sure we have at least one paragraph and
				// last node is never a decorator to prevent weird selection behaviour
				if (childrenSize < 1 || $isDecoratorNode(lastChild)) {
					node.append($createParagraphNode().append($createTextNode("")));
				}
			}),
			editor.registerNodeTransform(SplitLayoutContainerNode, (node) => {
				const CHILDREN_TO_HAVE = 2;
				const children = node.getChildren();
				const childrenSize = children.length;
				if (childrenSize !== CHILDREN_TO_HAVE) {
					const childrenToCreate = CHILDREN_TO_HAVE - childrenSize;
					for (let i = 0; i < childrenToCreate; i++) {
						const newChildColumn = $createSplitLayoutColumnNode();
						node.append(newChildColumn);
					}
				}
			}),
			editor.registerCommand(
				KEY_ARROW_UP_COMMAND,
				() => {
					const selection = $getSelection();
					if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
						return false;
					}

					const container = $findMatchingParent(
						selection.anchor.getNode(),
						$isSplitLayoutContainerNode
					);

					if (container === null) {
						return false;
					}

					const parent = container.getParent();
					if (parent !== null && parent.getFirstChild() === container) {
						parent.splice(0, 0, [
							$createParagraphNode().append($createTextNode("Arrow up para")),
						]);
					}
					return false;
				},
				COMMAND_PRIORITY_LOW
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

					const container = $findMatchingParent(
						anchorNode,
						$isSplitLayoutContainerNode
					);

					if (anchorNode.getTextContentSize() > 0) {
						return false;
					}

					if (!$isSplitLayoutContainerNode(container)) return false;

					const parent = container.getParent();
					if (parent === null) return false;

					const targetRow = container.getLastChild();
					if (!targetRow) return false;

					const targetChild = (
						targetRow as SplitLayoutContainerNode
					).getLastChild();
					if (!targetChild) return false;

					if (anchorNode !== targetChild) return false;

					if (selection.anchor.offset < targetChild.getTextContentSize())
						return false;

					const newTextNode = $createTextNode("");
					const newParagraph = $createParagraphNode().append(newTextNode);
					container.insertAfter(newParagraph, false);
					newTextNode.select();
					anchorNode.remove();
					e?.preventDefault();
					return true;
				},
				COMMAND_PRIORITY_LOW
			),
			editor.registerNodeTransform(SplitLayoutColumnNode, (node) => {
				const parent = node.getParent();
				if (!$isSplitLayoutContainerNode(parent)) {
					const children = node.getChildren();
					for (const child of children) {
						node.insertBefore(child);
					}
					node.remove();
				}
			})
		);
	}, [editor]);

	useEffect(() => {
		return mergeRegister(
			editor.registerCommand(
				SET_LAYOUT_MODE_SPLIT,
				() => {
					const selection = $getSelection();
					if (!selection) {
						return true;
					}

					const splitContainer = $createSplitLayoutContainerNode();

					const splitColumnRight = $createSplitLayoutColumnNode();
					const splitColumnLeft = $createSplitLayoutColumnNode();

					const paragraphNodeRight = $createParagraphNode().append(
						$createTextNode("")
					);

					const nodes = selection.getNodes();
					const tempContainer = $createParagraphNode();

					let what = false;
					console.debug({ nodes });
					for (const node of nodes) {
						let elementNode = null;
						if ($isLeafNode(node)) {
							const target = node.getTopLevelElement();
							if (!target) continue;
							elementNode = target;
						} else {
							elementNode = node;
						}
						console.debug({ elementNode });

						if (!elementNode) return true;

						if ($findMatchingParent(elementNode, $isSplitLayoutContainerNode))
							// Double nesting is not allowed!
							continue;

						if (!what) {
							elementNode.insertAfter(tempContainer);
							tempContainer.select();
							what = true;
						}

						splitColumnLeft.append(elementNode);
					}

					splitColumnRight.append(paragraphNodeRight);
					splitContainer.append(splitColumnLeft, splitColumnRight);
					tempContainer.replace(splitContainer);
					return true;
				},
				COMMAND_PRIORITY_LOW
			),
			editor.registerCommand(
				SET_LAYOUT_MODE_FULL,
				() => {
					const selection = $getSelection();
					if (!selection) {
						return true;
					}

					const targetElement = selection.getNodes()[0];

					if (!targetElement) return true;

					const parentSplitContainer = $findMatchingParent(
						targetElement,
						$isSplitLayoutContainerNode
					);

					if (!$isSplitLayoutContainerNode(parentSplitContainer)) return true;

					const splitColumns = parentSplitContainer.getChildren();

					if (splitColumns.length !== 2) return true;
					const currentLeft = splitColumns[0];
					const currentRight = splitColumns[1];

					if (
						!$isSplitLayoutColumnNode(currentLeft) ||
						!$isSplitLayoutColumnNode(currentRight)
					)
						return true;

					const parentIndex = parentSplitContainer.getIndexWithinParent();
					const splitParent = parentSplitContainer.getParent();

					if (splitParent !== $getRoot()) return true;

					splitParent.splice(parentIndex, 1, [
						...currentLeft.getChildren(),
						...currentRight.getChildren(),
					]);
					return true;
				},
				COMMAND_PRIORITY_LOW
			),
			editor.registerCommand(
				SWAP_SPLIT_COLUMNS,
				() => {
					const selection = $getSelection();
					if (!selection) {
						return true;
					}

					const targetElement = selection.getNodes()[0];

					if (!targetElement) return true;

					const parentSplitContainer = $findMatchingParent(
						targetElement,
						$isSplitLayoutContainerNode
					);

					if (!parentSplitContainer) return true;

					const splitColumns = (
						parentSplitContainer as SplitLayoutContainerNode
					).getChildren();

					if (splitColumns.length !== 2) return true;
					const currentLeft = splitColumns[0];
					const currentRight = splitColumns[1];

					if (!currentLeft || !currentRight) return true;

					parentSplitContainer.append(currentRight, currentLeft);
					return true;
				},
				COMMAND_PRIORITY_LOW
			)
		);
	}, [editor]);

	return null;
};

export default SplitLayoutPlugin;
