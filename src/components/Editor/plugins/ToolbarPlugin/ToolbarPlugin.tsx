import type { NodeKey } from "lexical";
import type { HeadingTagType } from "@lexical/rich-text";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { trpc } from "@utils/trpc";
import { SHOW_FLOATING_WORD_EDITOR_COMMAND } from "@editor/Editor";
import { $createWordNode } from "@components/nodes/WordNode";
import {
	$getSelection,
	$isRangeSelection,
	$isRootOrShadowRoot,
	$isNodeSelection,
	SELECTION_CHANGE_COMMAND,
	COMMAND_PRIORITY_CRITICAL,
	$createParagraphNode,
	$createNodeSelection,
	$setSelection,
} from "lexical";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import { $createHeadingNode, $isHeadingNode } from "@lexical/rich-text";
import { $wrapNodes } from "@lexical/selection";
import React, { useState, useCallback, useEffect, useRef } from "react";
import Button from "@ui/Button";
import Dropdown from "@ui/Dropdown";
import { ButtonGroup } from "@ui/Button";

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
};

const WordStore = new Map<NodeKey, string>();

const ToolbarPlugin = () => {
	const [editor] = useLexicalComposerContext();
	const [idToLoad, setIdToLoad] = useState<string | null>(null);
	const x = useRef<HTMLElement>();
	x.current;
	const utils = trpc.useContext();

	const showWordEditor = useCallback(() => {
		editor.dispatchCommand(SHOW_FLOATING_WORD_EDITOR_COMMAND, undefined);
	}, [editor]);

	const wordTest = useCallback(() => {
		utils.dictionary.getWord.setData({
			translation: "TTEST",
			word: "WTEST",
			id: "undefined",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		utils.dictionary.getWord.invalidate();
		utils.dictionary.getWord.cancel();
	}, [utils.dictionary.getWord]);

	const createWord = trpc.dictionary.createWord.useMutation();

	const upsertDocument = trpc.document.createDocument.useMutation();

	const documentToLoad = trpc.document.getById.useQuery(idToLoad || "", {
		enabled: !!idToLoad,
	});

	const [blockType, setBlockType] =
		useState<keyof typeof blockTypeToBlockName>("paragraph");

	useEffect(() => {
		if (documentToLoad.data && documentToLoad.isFetched) {
			setIdToLoad(null);
			const parsedState = editor.parseEditorState(
				documentToLoad.data.serializedDocument
			);
			editor.setEditorState(parsedState);
		}
	}, [documentToLoad, editor]);

	const loadDocument = useCallback(() => {
		setIdToLoad("clah1kjb50004u5ejvqfvxs81");
	}, []);

	const saveDocument = useCallback(async () => {
		const serializedState = JSON.stringify(editor.getEditorState());
		await upsertDocument.mutate({
			title: "test upsert",
			serializedDocument: serializedState,
		});
	}, [editor, upsertDocument]);

	const updateToolbar = useCallback(() => {
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
				const type = $isHeadingNode(element)
					? element.getTag()
					: element.getType();
				if (type in blockTypeToBlockName) {
					setBlockType(type as keyof typeof blockTypeToBlockName);
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
					setBlockType(type as keyof typeof blockTypeToBlockName);
				}
			}
		}
	}, [editor]);

	useEffect(() => {
		return mergeRegister(
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					updateToolbar();
					return false;
				},
				COMMAND_PRIORITY_CRITICAL
			),
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(() => {
					updateToolbar();
				});
			})
		);
	}, [editor, updateToolbar]);

	const formatHeading = (headingSize: HeadingTagType) => () => {
		editor.update(() => {
			const selection = $getSelection();

			if ($isRangeSelection(selection)) {
				if (blockType === headingSize) {
					$wrapNodes(selection, () => $createParagraphNode());
				} else {
					$wrapNodes(selection, () => $createHeadingNode(headingSize));
				}
			}
		});
	};

	const selectWord = useCallback(() => {
		editor.update(() => {
			const [targetKey] = WordStore.keys();

			if (!targetKey) {
				return;
			}

			const nodeSelection = $createNodeSelection();
			nodeSelection.add(targetKey);
			$setSelection(nodeSelection);
		});
	}, [editor]);

	const insertWord = useCallback(async () => {
		const translation = "translation123";
		const word = await editor.getEditorState().read(async () => {
			const selection = $getSelection();
			if (!selection) {
				return;
			}
			const text = selection.getTextContent();
			return text;
		});
		if (!word) {
			return;
		}

		const newWord = await createWord.mutateAsync({ translation, word });
		editor.update(async () => {
			const selection = $getSelection();

			if ($isRangeSelection(selection)) {
				const newWordNode = $createWordNode(
					newWord.translation,
					newWord.word,
					newWord.id
				);
				WordStore.set(newWordNode.getKey(), word);
				selection.insertNodes([newWordNode]);
			}
		});
	}, [createWord, editor]);
	return (
		<div className="textarea-bordered textarea w-full rounded-b-none p-0">
			<ButtonGroup>
				<Button ghost>1</Button>
				<Button ghost>2</Button>
				<Dropdown ghost>
					<Button ghost full>
						1
					</Button>
					<Button ghost full>
						2
					</Button>
					<span className="w-full bg-gray-50 px-1 py-2">hi</span>
					<Button ghost full>
						3
					</Button>
				</Dropdown>
				<span className="bg-gray-50 px-1 py-2">hi</span>
				<Button ghost>3</Button>
			</ButtonGroup>
		</div>
	);
};

export default ToolbarPlugin;
