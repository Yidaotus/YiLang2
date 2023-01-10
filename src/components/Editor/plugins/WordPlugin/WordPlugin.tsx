import { $createWordNode, WordNode } from "@components/Editor/nodes/WordNode";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import useEditorStore from "@store/store";
import {
	$createNodeSelection,
	$createRangeSelection,
	$getRoot,
	$getSelection,
	$insertNodes,
	$isElementNode,
	$setSelection,
	COMMAND_PRIORITY_LOW,
	createCommand,
} from "lexical";
import { useEffect } from "react";

export const INSERT_WORD = createCommand<{
	translations: string[];
	word: string;
	id?: string | undefined;
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
				INSERT_WORD,
				(word) => {
					const selection = $getSelection();
					if (!selection) return false;

					const initialWordNode = $createWordNode(
						word.translations,
						word.word,
						word.id,
						false
					);
					$insertNodes([initialWordNode]);

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
										word.id,
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
	}, [editor]);

	return null;
};

export default WordPlugin;
