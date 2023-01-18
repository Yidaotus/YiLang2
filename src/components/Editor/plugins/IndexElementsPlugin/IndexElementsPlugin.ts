import {
	$isGrammarPointTitleNode,
	GrammarPointTitleNode,
} from "@components/Editor/nodes/GrammarPoint/GrammarPointTitleNode";
import {
	$isSentenceNode,
	SentenceNode,
} from "@components/Editor/nodes/Sentence/SentenceNode";
import { WordNode } from "@components/Editor/nodes/WordNode";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
	useOutlineActions,
	useOutlineGrammarPoints,
	useOutlineSentences,
	useOutlineServerState,
	useOutlineWords,
} from "@store/outline";
import type { LexicalNode } from "lexical";
import {
	$getNodeByKey,
	$getSelection,
	$isNodeSelection,
	$isRangeSelection,
	BLUR_COMMAND,
	CLEAR_EDITOR_COMMAND,
	COMMAND_PRIORITY_NORMAL,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { DOCUMENT_LOADED_COMMAND } from "../FetchDocumentPlugin/FetchDocumentPlugin";
import { SAVE_EDITOR } from "../SaveToDBPlugin/SaveToDBPlugin";

const checkForBlurredElement =
	<T extends LexicalNode>({
		isBlur,
		previousFoundNodeKey,
		onBlur,
		findFn,
	}: {
		isBlur: boolean;
		previousFoundNodeKey: string | null;
		onBlur: (node: T) => void;
		findFn: (node: LexicalNode) => node is LexicalNode & T;
	}) =>
	() => {
		const selection = $getSelection();
		let foundElement = null;

		if (!isBlur && selection) {
			let startNode;
			if ($isRangeSelection(selection) && selection.isCollapsed()) {
				startNode = selection.anchor.getNode();
			} else if ($isRangeSelection(selection) && !selection.isCollapsed()) {
				const anchorNode = selection.anchor.getNode();
				const focusNode = selection.focus.getNode();

				if (anchorNode === focusNode) {
					startNode = anchorNode;
				}
			} else if ($isNodeSelection(selection)) {
				const firstNode = selection.getNodes()[0];
				if (firstNode) {
					startNode = firstNode;
				}
			}
			if (startNode) {
				foundElement = $findMatchingParent(startNode, findFn);
			}
		}

		if (
			(!foundElement && previousFoundNodeKey) ||
			(foundElement &&
				previousFoundNodeKey &&
				foundElement.getKey() !== previousFoundNodeKey)
		) {
			const node = $getNodeByKey(previousFoundNodeKey);
			if (!node || !findFn(node)) return false;

			onBlur(node);
		}

		previousFoundNodeKey = foundElement?.getKey() || null;
	};

const IndexElementsPlugin = () => {
	const [editor] = useLexicalComposerContext();
	const {
		appendGrammarPoint,
		appendSentence,
		appendWord,
		clear: clearStore,
		markServerState,
		removeGrammarPoint,
		removeSentence,
		removeWord,
	} = useOutlineActions();

	const sentenceStore = useOutlineSentences();
	const wordStore = useOutlineWords();
	const grammarPointStore = useOutlineGrammarPoints();
	const serverState = useOutlineServerState();

	//const blurFoundWordKey = useRef<string | null>(null);
	const blurFoundGrammarPointKey = useRef<string | null>(null);
	const blurFoundSentenceKey = useRef<string | null>(null);

	const checkForSentenceBlur = useMemo(
		() =>
			checkForBlurredElement({
				isBlur: false,
				findFn: $isSentenceNode,
				previousFoundNodeKey: blurFoundSentenceKey.current,
				onBlur: (node) => {
					const nodeKey = node.getKey();
					const textContent = node.getTextContent();
					const translation = node.getTranslation();

					const previousNode = sentenceStore[nodeKey];
					if (previousNode && previousNode.sentence === textContent) {
						return;
					}
					appendSentence({
						key: nodeKey,
						sentence: {
							sentence: textContent,
							translation: translation,
						},
					});
				},
			}),
		[appendSentence, sentenceStore]
	);

	const checkForGrammarBlur = useMemo(
		() =>
			checkForBlurredElement({
				isBlur: false,
				findFn: $isGrammarPointTitleNode,
				previousFoundNodeKey: blurFoundGrammarPointKey.current,
				onBlur: (node) => {
					const nodeKey = node.getKey();
					const title = node.getTextContent();

					const previousNode = grammarPointStore[nodeKey];
					if (previousNode && previousNode.title === title) {
						return;
					}
					appendGrammarPoint({
						key: nodeKey,
						grammarPoint: {
							title: title,
						},
					});
				},
			}),
		[appendGrammarPoint, grammarPointStore]
	);

	const reconcileServerState = useCallback(() => {
		const { sentences: serverSentences } = serverState;
		for (const [nodeKey, sentence] of Object.entries(sentenceStore)) {
			const serverSentence = serverSentences[nodeKey];
			if (serverSentence) {
				const sentenceDifference =
					sentence.sentence !== serverSentence.sentence;
				const translationDifference =
					sentence.translation !== serverSentence.translation;

				const isDirty = sentenceDifference || translationDifference;
				if (isDirty) {
					// upsert
				}

				delete serverSentences[nodeKey];
			}
		}

		for (const [nodeKey, sentence] of Object.entries(serverSentences)) {
			const shouldDelete = true;
			if (shouldDelete) {
				// delete
			}
		}

		markServerState();
	}, [markServerState, sentenceStore, serverState]);

	useEffect(() => {
		return mergeRegister(
			editor.registerCommand(
				SAVE_EDITOR,
				() => {
					reconcileServerState();
					return false;
				},
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerCommand(
				DOCUMENT_LOADED_COMMAND,
				() => {
					markServerState();
					return false;
				},
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerCommand(
				CLEAR_EDITOR_COMMAND,
				() => {
					clearStore();
					return false;
				},
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					checkForGrammarBlur();
					checkForSentenceBlur();
					return false;
				},
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerCommand(
				BLUR_COMMAND,
				() => {
					checkForGrammarBlur();
					checkForSentenceBlur();
					return false;
				},
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerUpdateListener(() => {
				editor.getEditorState().read(() => {
					checkForGrammarBlur();
					checkForSentenceBlur();
				});
			}),
			editor.registerMutationListener(WordNode, (mutatedNodes) => {
				for (const [nodeKey, mutation] of mutatedNodes) {
					if (mutation === "created") {
						editor.getEditorState().read(() => {
							const wordNode = $getNodeByKey(nodeKey) as WordNode;

							const wordId = wordNode.getId();
							if (!wordId) return;

							const isAutoFill = wordNode.getIsAutoFill();

							appendWord({
								key: nodeKey,
								word: {
									wordId,
									isAutoFill,
								},
							});
						});
					}
					if (mutation === "destroyed") {
						removeWord(nodeKey);
					}
				}
			}),
			editor.registerMutationListener(GrammarPointTitleNode, (mutatedNodes) => {
				for (const [nodeKey, mutation] of mutatedNodes) {
					if (mutation === "created" || mutation === "updated") {
						editor.getEditorState().read(() => {
							const grammarPointTitleNode = $getNodeByKey(nodeKey);
							if (!$isGrammarPointTitleNode(grammarPointTitleNode)) return;

							const title = grammarPointTitleNode.getTextContent();

							const previousNode = grammarPointStore[nodeKey];
							if (previousNode && previousNode.title === title) {
								return;
							}
							appendGrammarPoint({
								key: nodeKey,
								grammarPoint: {
									title: title,
								},
							});
						});
					}
					if (mutation === "destroyed") {
						removeGrammarPoint(nodeKey);
					}
				}
			}),
			editor.registerMutationListener(SentenceNode, (mutatedNodes) => {
				editor.getEditorState().read(() => {
					const newStore = { ...sentenceStore };
					for (const [nodeKey, mutation] of mutatedNodes) {
						if (mutation === "created" || mutation === "updated") {
							const sentenceNode = $getNodeByKey(nodeKey);
							if (!$isSentenceNode(sentenceNode)) return;

							const textContent = sentenceNode.getTextContent();
							const translation = sentenceNode.getTranslation();

							const previousNode = sentenceStore[nodeKey];
							if (previousNode && previousNode.sentence === textContent) {
								return;
							}

							appendSentence({
								key: nodeKey,
								sentence: {
									sentence: textContent,
									translation: translation,
								},
							});
						}
						if (mutation === "destroyed") {
							removeSentence(nodeKey);
						}
					}
				});
			})
		);
	}, [
		appendGrammarPoint,
		appendSentence,
		appendWord,
		checkForGrammarBlur,
		checkForSentenceBlur,
		clearStore,
		editor,
		grammarPointStore,
		markServerState,
		reconcileServerState,
		removeGrammarPoint,
		removeSentence,
		removeWord,
		sentenceStore,
		wordStore,
	]);

	return null;
};

export default IndexElementsPlugin;
