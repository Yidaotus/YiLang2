import { $isSplitLayoutContainerNode } from "@components/Editor/nodes/SplitLayout/SplitLayoutContainer";
import { $isListNode, ListNode } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isHeadingNode } from "@lexical/rich-text";
import {
	$findMatchingParent,
	$getNearestNodeOfType,
	mergeRegister,
} from "@lexical/utils";
import {
	$getSelection,
	$isNodeSelection,
	$isRangeSelection,
	$isRootOrShadowRoot,
	COMMAND_PRIORITY_LOW,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useCallback, useEffect } from "react";

const blockTypeToBlockName = {
	bullet: "Bulleted List",
	check: "Check List",
	code: "Code Block",
	h1: "Heading 1",
	h2: "Heading 2",
	h3: "Heading 3",
	h4: "Heading 4",
	h5: "Heading 5",
	h6: "Heading 6",
	number: "Numbered List",
	paragraph: "Normal",
	quote: "Quote",
	image: "Image",
	remark: "Remark",
};

export type SelectedBlockType = keyof typeof blockTypeToBlockName;

export type SelectedBlock = {
	type: SelectedBlockType;
	key: string;
	layoutMode: "split" | "full";
};

type SelectedBlockTypePluginProps = {
	setSelectedBlockType: (blockType: SelectedBlock) => void;
};

const SelectedBlockTypePlugin = ({
	setSelectedBlockType,
}: SelectedBlockTypePluginProps) => {
	const [editor] = useLexicalComposerContext();

	const getCurrentBlockType = useCallback(() => {
		const selection = $getSelection();

		if ($isRangeSelection(selection)) {
			const anchorNode = selection.anchor.getNode();
			let topLevelElement =
				anchorNode.getKey() === "root"
					? anchorNode
					: $findMatchingParent(anchorNode, (e) => {
							const parent = e.getParent();
							return parent !== null && $isRootOrShadowRoot(parent);
					  });

			if (topLevelElement === null) {
				topLevelElement = anchorNode.getTopLevelElementOrThrow();
			}

			const elementKey = topLevelElement.getKey();
			const elementDOM = editor.getElementByKey(elementKey);

			const layoutMode =
				$findMatchingParent(anchorNode, $isSplitLayoutContainerNode) !== null
					? "split"
					: "full";

			if (elementDOM !== null) {
				if ($isListNode(topLevelElement)) {
					const parentList = $getNearestNodeOfType<ListNode>(
						anchorNode,
						ListNode
					);
					const type = parentList
						? parentList.getListType()
						: topLevelElement.getListType();
					setSelectedBlockType({
						type: type as SelectedBlockType,
						key: elementKey,
						layoutMode,
					});
				} else {
					/*
					const container = $findMatchingParent(
						selection.anchor.getNode(),
						$isRemarkContainerNode
					);

					if (container !== null) {
						setSelectedBlockType({
							type: "remark",
							key: elementKey,
							layoutMode,
						});

						return;
					}
					*/

					const type = $isHeadingNode(topLevelElement)
						? topLevelElement.getTag()
						: topLevelElement.getType();
					if (type in blockTypeToBlockName) {
						setSelectedBlockType({
							type: type as SelectedBlockType,
							key: elementKey,
							layoutMode,
						});
					}
				}
			}
		}
		if ($isNodeSelection(selection)) {
			const anchorNode = selection.getNodes()[0];
			if (!anchorNode) {
				return;
			}
			let element =
				anchorNode.getKey() === "root"
					? anchorNode
					: $findMatchingParent(anchorNode, (e) => {
							const parent = e.getParent();
							return parent !== null && $isRootOrShadowRoot(parent);
					  });

			if (element === null) {
				element = anchorNode.getTopLevelElementOrThrow();
			}

			const elementKey = element.getKey();
			const elementDOM = editor.getElementByKey(elementKey);

			const layoutMode =
				$findMatchingParent(anchorNode, $isSplitLayoutContainerNode) !== null
					? "split"
					: "full";

			if (elementDOM !== null) {
				const type = $isHeadingNode(element)
					? element.getTag()
					: element.getType();
				if (type in blockTypeToBlockName) {
					setSelectedBlockType({
						type: type as SelectedBlockType,
						key: elementKey,
						layoutMode,
					});
				}
			}
		}
	}, [editor, setSelectedBlockType]);

	useEffect(() => {
		editor.getEditorState().read(() => {
			getCurrentBlockType();
		});
		return mergeRegister(
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(() => {
					getCurrentBlockType();
				});
			}),

			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					getCurrentBlockType();
					return false;
				},
				COMMAND_PRIORITY_LOW
			)
		);
	}, [editor, getCurrentBlockType]);

	return null;
};

export default SelectedBlockTypePlugin;
