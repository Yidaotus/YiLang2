import { $isSentenceNode } from "@components/Editor/nodes/Sentence/SentenceNode";
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
	grammarPoint: "Grammar Point",
	table: "Table",
};

export type SelectedBlockType = keyof typeof blockTypeToBlockName;

export type SelectedBlock = {
	type: SelectedBlockType;
	key: string;
	layoutMode: "split" | "full";
	sentenceKey: string | null;
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

		let anchorNode;
		if ($isRangeSelection(selection)) {
			anchorNode = selection.anchor.getNode();
		} else if ($isNodeSelection(selection)) {
			anchorNode = selection.getNodes()[0];
		}
		if (!anchorNode) return;

		const topLevelElement = anchorNode.getTopLevelElement();
		if (topLevelElement === null) return;

		const elementKey = topLevelElement.getKey();
		const elementDOM = editor.getElementByKey(elementKey);

		const layoutMode =
			$findMatchingParent(anchorNode, $isSplitLayoutContainerNode) !== null
				? "split"
				: "full";

		let sentenceKey: null | string = null;
		if (
			$isNodeSelection(selection) ||
			($isRangeSelection(selection) && selection.isCollapsed())
		) {
			const sentenceNode = $findMatchingParent(anchorNode, $isSentenceNode);
			if (sentenceNode) {
				sentenceKey = sentenceNode.getKey();
			}
		}

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
					sentenceKey,
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
						sentenceKey,
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
