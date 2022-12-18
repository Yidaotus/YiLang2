import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$getSelection,
	$isRangeSelection,
	$isRootOrShadowRoot,
	$isNodeSelection,
	SELECTION_CHANGE_COMMAND,
	COMMAND_PRIORITY_LOW,
} from "lexical";
import { $isListNode, ListNode } from "@lexical/list";
import { $isHeadingNode } from "@lexical/rich-text";
import {
	mergeRegister,
	$findMatchingParent,
	$getNearestNodeOfType,
} from "@lexical/utils";
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
};

export type SelectedBlockType = keyof typeof blockTypeToBlockName;

export type SelectedBlock = {
	type: SelectedBlockType;
	key: string;
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

			if (elementDOM !== null) {
				if ($isListNode(element)) {
					const parentList = $getNearestNodeOfType<ListNode>(
						anchorNode,
						ListNode
					);
					const type = parentList
						? parentList.getListType()
						: element.getListType();
					setSelectedBlockType({
						type: type as SelectedBlockType,
						key: elementKey,
					});
				} else {
					const type = $isHeadingNode(element)
						? element.getTag()
						: element.getType();
					if (type in blockTypeToBlockName) {
						setSelectedBlockType({
							type: type as SelectedBlockType,
							key: elementKey,
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

			if (elementDOM !== null) {
				const type = $isHeadingNode(element)
					? element.getTag()
					: element.getType();
				if (type in blockTypeToBlockName) {
					setSelectedBlockType({
						type: type as SelectedBlockType,
						key: elementKey,
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
