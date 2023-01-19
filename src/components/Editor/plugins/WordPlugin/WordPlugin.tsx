import {
	$createWordNode,
	$isWordNode,
	WordNode,
} from "@components/Editor/nodes/WordNode";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import useEditorStore from "@store/store";
import {
	$createNodeSelection,
	$createRangeSelection,
	$createTextNode,
	$getRoot,
	$getSelection,
	$insertNodes,
	$isDecoratorNode,
	$isElementNode,
	$isNodeSelection,
	$isRangeSelection,
	$setSelection,
	COMMAND_PRIORITY_EDITOR,
	COMMAND_PRIORITY_LOW,
	COMMAND_PRIORITY_NORMAL,
	createCommand,
	KEY_ARROW_LEFT_COMMAND,
	KEY_ARROW_RIGHT_COMMAND,
	KEY_BACKSPACE_COMMAND,
	KEY_DELETE_COMMAND,
} from "lexical";
import { useEffect } from "react";

export const INSERT_WORD = createCommand<{
	translations: string[];
	word: string;
	databaseId: string | null;
}>("INSERT_WORD");

const WordPlugin = () => {
	const [editor] = useLexicalComposerContext();
	const markAllInstances = useEditorStore(
		(store) => store.editorMarkAllInstances
	);

	useEffect(() => {
		if (!editor.hasNodes([WordNode])) {
			throw new Error("WordPlugin: WordNode not registered on editor");
		}

		return mergeRegister(
			editor.registerCommand(
				KEY_DELETE_COMMAND,
				() => {
					const selection = $getSelection();
					if (!selection || !$isNodeSelection(selection)) return false;

					for (const node of selection.getNodes()) {
						if ($isWordNode(node)) {
							node.selectPrevious();
							node.remove();
						}
					}
					return false;
				},
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerCommand(
				KEY_BACKSPACE_COMMAND,
				() => {
					const selection = $getSelection();
					if (!selection || !$isNodeSelection(selection)) return false;

					for (const node of selection.getNodes()) {
						if ($isWordNode(node)) {
							node.selectPrevious();
							node.remove();
						}
					}
					return false;
				},
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerCommand<KeyboardEvent>(
				KEY_ARROW_LEFT_COMMAND,
				() => {
					const selection = $getSelection();
					if ($isNodeSelection(selection)) {
						const nodes = selection.getNodes();
						const targetNode = nodes[0];
						if (targetNode) {
							const previousNode = targetNode.getPreviousSibling();

							if ($isDecoratorNode(previousNode) && previousNode.isInline()) {
								previousNode.insertAfter($createTextNode(" "));
								previousNode.selectNext();
								return true;
							}
						}
					}
					return false;
				},
				COMMAND_PRIORITY_EDITOR
			),
			editor.registerCommand(
				KEY_ARROW_LEFT_COMMAND,
				() => {
					const selection = $getSelection();
					if (!selection || !$isNodeSelection(selection)) return false;

					for (const node of selection.getNodes()) {
						if (!$isWordNode(node)) return false;

						const sibling = node.getPreviousSibling();
						if (!sibling || $isWordNode(sibling)) {
							node.insertBefore($createTextNode(" "));
						}
					}

					return false;
				},
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerCommand(
				KEY_ARROW_RIGHT_COMMAND,
				() => {
					const selection = $getSelection();
					if (!selection || !$isNodeSelection(selection)) return false;

					for (const node of selection.getNodes()) {
						if (!$isWordNode(node)) return false;

						const sibling = node.getNextSibling();
						if (!sibling || $isWordNode(sibling)) {
							node.insertAfter($createTextNode(" "));
						}
					}

					return false;
				},
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerCommand(
				INSERT_WORD,
				(word) => {
					const selection = $getSelection();
					if (!selection || !$isRangeSelection(selection)) return false;

					const initialWordNode = $createWordNode(
						word.translations,
						word.word,
						word.databaseId,
						false
					);
					const extractedNodes = selection.extract();
					for (const [index, node] of extractedNodes.entries()) {
						if (index === 0) {
							node.replace(initialWordNode);
						} else {
							node.remove();
						}
					}

					if (markAllInstances) {
						const root = $getRoot();
						const searchRegex = new RegExp(word.word, "gi");
						for (const node of root.getChildren()) {
							if (!$isElementNode(node)) continue;
							const textChildren = node.getAllTextNodes();
							for (const textNode of textChildren) {
								const matches = textNode.getTextContent().matchAll(searchRegex);
								for (const match of matches) {
									if (match.index === undefined) continue;
									const selection = $createRangeSelection();
									selection.anchor.set(textNode.getKey(), match.index, "text");
									selection.focus.set(
										textNode.getKey(),
										match.index + word.word.length,
										"text"
									);
									$setSelection(selection);
									const wordNode = $createWordNode(
										word.translations,
										word.word,
										word.databaseId,
										true
									);
									$insertNodes([wordNode]);
								}
							}
						}
						const initialSelection = $createNodeSelection();
						initialSelection.add(initialWordNode.getKey());
						$setSelection(initialSelection);
					}
					return true;
				},
				COMMAND_PRIORITY_LOW
			)
		);
	}, [editor, markAllInstances]);

	return null;
};

export default WordPlugin;
function $findMatchingParent(
	arg0: import("lexical").ElementNode | import("lexical").TextNode,
	$isSentenceNode: any
) {
	throw new Error("Function not implemented.");
}
