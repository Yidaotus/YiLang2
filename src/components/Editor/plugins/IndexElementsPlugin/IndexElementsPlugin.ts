import { $isGrammarPointContainerNode } from "@components/Editor/nodes/GrammarPoint/GrammarPointContainerNode";
import {
	$isGrammarPointTitleNode,
	GrammarPointTitleNode,
} from "@components/Editor/nodes/GrammarPoint/GrammarPointTitleNode";
import {
	$isSentenceNode,
	SentenceNode,
} from "@components/Editor/nodes/Sentence/SentenceNode";
import { $isWordNode, WordNode } from "@components/Editor/nodes/WordNode";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
	useOutlineActions,
	useOutlineGrammarPoints,
	useOutlineSentences,
	useOutlineWords,
} from "@store/outline";
import useEditorSettingsStore from "@store/store";
import { trpc } from "@utils/trpc";
import { filterNullish } from "@utils/utils";
import type { LexicalNode, NodeMutation } from "lexical";
import {
	$getNodeByKey,
	$getSelection,
	$isNodeSelection,
	$isRangeSelection,
	BLUR_COMMAND,
	CLEAR_EDITOR_COMMAND,
	COMMAND_PRIORITY_CRITICAL,
	COMMAND_PRIORITY_NORMAL,
	createCommand,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { DOCUMENT_LOADED_COMMAND } from "../FetchDocumentPlugin/FetchDocumentPlugin";
import {
	$getAllNodesOfType,
	SAVE_EDITOR,
} from "../SaveToDBPlugin/SaveToDBPlugin";

export const RECONCILE_AND_SAVE_EDITOR = createCommand<{
	shouldShowToast: boolean;
}>("RECONCILE_AND_SAVE_EDITOR");

const checkForBlurredElement =
	<T extends LexicalNode>({
		isBlur,
		previousFoundNodeKey,
		onBlur,
		findFn,
	}: {
		isBlur: boolean;
		previousFoundNodeKey: string | null;
		onBlur: (node: T, mutation: NodeMutation) => void;
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

			onBlur(node, "updated");
		}

		previousFoundNodeKey = foundElement?.getKey() || null;
	};

type IndexElementsPluginProps = {
	documentId: string;
};

const IndexElementsPlugin = ({ documentId }: IndexElementsPluginProps) => {
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
		markGrammarPointClean,
		markSentenceClean,
	} = useOutlineActions();

	const sentenceStore = useOutlineSentences();
	const wordStore = useOutlineWords();
	const grammarPointStore = useOutlineGrammarPoints();
	const selectedLanguage = useEditorSettingsStore(
		(store) => store.selectedLanguage
	);

	const trpcUtils = trpc.useContext();
	const upsertSentence = trpc.dictionary.sentence.upsert.useMutation({
		onSuccess({ id, nodeKey }) {
			trpcUtils.dictionary.sentence.getForWord.invalidate();
			if (nodeKey) {
				editor.update(() => {
					const node = $getNodeByKey(nodeKey);
					if (!$isSentenceNode(node)) return;

					node.setDatabaseId(id);
				});

				markSentenceClean(nodeKey);
			}
		},
	});
	const deleteSentences = trpc.dictionary.sentence.deleteMany.useMutation({
		onSuccess({ nodeKeys }) {
			trpcUtils.dictionary.sentence.getForWord.invalidate();
			if (nodeKeys) {
				for (const nodeKey of nodeKeys) {
					markGrammarPointClean(nodeKey);
				}
			}
		},
	});

	const upsertGrammarPoint = trpc.dictionary.grammarPoint.upsert.useMutation({
		onSuccess({ nodeKey, id, ...rest }) {
			if (nodeKey) {
				editor.update(() => {
					const node = $getNodeByKey(nodeKey);
					if (!$isGrammarPointTitleNode(node)) return;

					const container = node.getParent();
					if (!$isGrammarPointContainerNode(container)) return;

					container.setDatabaseId(id);
				});
				// @TODO This should automatically happen in mutationListener!!!
				appendGrammarPoint({
					key: nodeKey,
					grammarPoint: { ...rest, databaseId: id },
				});

				markGrammarPointClean(nodeKey);
			}
		},
	});
	const deleteGrammarPoints =
		trpc.dictionary.grammarPoint.deleteMany.useMutation({
			onSuccess({ nodeKeys }) {
				if (nodeKeys) {
					for (const nodeKey of nodeKeys) {
						markGrammarPointClean(nodeKey);
					}
				}
			},
		});

	//const blurFoundWordKey = useRef<string | null>(null);
	const blurFoundGrammarPointKey = useRef<string | null>(null);
	const blurFoundSentenceKey = useRef<string | null>(null);

	const generateSentenceMutation = useCallback(
		(node: SentenceNode, mutation: NodeMutation) => {
			const nodeKey = node.getKey();
			const textContent = node.getTextContent();
			const translation = node.getTranslation();
			const databaseId = node.getDatabaseId();

			const containingWords = $getAllNodesOfType(node, $isWordNode);

			const newSentence = {
				sentence: textContent,
				translation: translation,
				containingWords: containingWords
					.map((word) => word.getDatabaseId())
					.filter(filterNullish),
				databaseId,
			};

			if (mutation === "destroyed") {
				removeSentence(nodeKey);
				return;
			}

			if (mutation === "updated") {
				const previousNode = sentenceStore[nodeKey];
				const sameWords =
					previousNode?.containingWords.length ===
						newSentence.containingWords.length &&
					previousNode.containingWords.every((value) => {
						return newSentence.containingWords.indexOf(value) > -1;
					});

				if (
					previousNode &&
					!previousNode.isDeleted &&
					newSentence.sentence === previousNode.sentence &&
					newSentence.databaseId === previousNode.databaseId &&
					newSentence.translation === previousNode.translation &&
					sameWords
				) {
					return;
				}
			}
			appendSentence({
				key: nodeKey,
				sentence: newSentence,
			});
		},
		[appendSentence, removeSentence, sentenceStore]
	);

	const generateGrammarPointMutation = useCallback(
		(node: GrammarPointTitleNode, mutation: NodeMutation) => {
			const container = node.getParent();
			if (!$isGrammarPointContainerNode(container)) return;

			const nodeKey = node.getKey();
			const title = node.getTextContent();
			const databaseId = container.getDatabaseId();

			if (mutation === "destroyed") {
				removeWord(nodeKey);
				return;
			}

			if (mutation === "updated") {
				const previousNode = grammarPointStore[nodeKey];
				if (previousNode && previousNode.title === title) {
					return;
				}
			}
			appendGrammarPoint({
				key: nodeKey,
				grammarPoint: {
					title,
					databaseId,
				},
			});
		},
		[appendGrammarPoint, grammarPointStore, removeWord]
	);

	const checkForSentenceBlur = useMemo(
		() =>
			checkForBlurredElement({
				isBlur: false,
				findFn: $isSentenceNode,
				previousFoundNodeKey: blurFoundSentenceKey.current,
				onBlur: generateSentenceMutation,
			}),
		[generateSentenceMutation]
	);

	const checkForGrammarBlur = useMemo(
		() =>
			checkForBlurredElement({
				isBlur: false,
				findFn: $isGrammarPointTitleNode,
				previousFoundNodeKey: blurFoundGrammarPointKey.current,
				onBlur: generateGrammarPointMutation,
			}),
		[generateGrammarPointMutation]
	);

	const reconcileServerState = useCallback(
		async (shouldShowToast: boolean) => {
			const allPromises: Array<Promise<any>> = [];
			const grammarPointsToUpsert = Object.entries(grammarPointStore).filter(
				([, grammarPoint]) => !grammarPoint.isDeleted && grammarPoint.isDirty
			);
			const grammarPointsToDelete = Object.entries(grammarPointStore).filter(
				([, grammarPoint]) => grammarPoint.isDeleted
			);

			for (const [nodeKey, grammarPoint] of grammarPointsToUpsert) {
				allPromises.push(
					upsertGrammarPoint.mutateAsync({
						id: grammarPoint.databaseId,
						title: grammarPoint.title,
						sourceDocumentId: documentId,
						nodeKey,
					})
				);
			}

			const gpIdsToDelete = grammarPointsToDelete
				.map(([, gp]) => gp.databaseId)
				.filter(filterNullish);
			const gpNodeKeysToDelete = grammarPointsToDelete
				.map(([nodeKey]) => nodeKey)
				.filter(filterNullish);
			if (gpIdsToDelete && gpIdsToDelete.length > 0) {
				allPromises.push(
					deleteGrammarPoints.mutateAsync({
						ids: gpIdsToDelete,
						nodeKeys: gpNodeKeysToDelete,
					})
				);
			}

			const sentencesToUpsert = Object.entries(sentenceStore).filter(
				([, sentence]) => !sentence.isDeleted && sentence.isDirty
			);
			const sentencesToDelete = Object.entries(sentenceStore).filter(
				([, sentence]) => sentence.isDeleted
			);

			for (const [nodeKey, sentence] of sentencesToUpsert) {
				allPromises.push(
					upsertSentence.mutateAsync({
						id: sentence.databaseId,
						sentence: sentence.sentence,
						translation: sentence.translation,
						containingWords: sentence.containingWords,
						languageId: selectedLanguage.id,
						sourceDocumentId: documentId,
						nodeKey,
					})
				);
			}

			const sentenceIdsToDelete = sentencesToDelete
				.map(([, sentence]) => sentence.databaseId)
				.filter(filterNullish);
			const sentenceNodeKeysToDelete = sentencesToDelete
				.map(([nodeKey]) => nodeKey)
				.filter(filterNullish);
			if (sentenceIdsToDelete && sentenceIdsToDelete.length > 0) {
				allPromises.push(
					deleteSentences.mutateAsync(
						{
							ids: sentenceIdsToDelete,
							nodeKeys: sentenceNodeKeysToDelete,
						},

						{
							onSuccess() {
								editor.dispatchCommand(SAVE_EDITOR, { shouldShowToast });
							},
						}
					)
				);
			}
			await Promise.allSettled(allPromises);
			editor.dispatchCommand(SAVE_EDITOR, { shouldShowToast });
		},
		[
			grammarPointStore,
			sentenceStore,
			upsertGrammarPoint,
			documentId,
			editor,
			deleteGrammarPoints,
			upsertSentence,
			selectedLanguage.id,
			deleteSentences,
		]
	);

	useEffect(() => {
		return mergeRegister(
			editor.registerCommand(
				RECONCILE_AND_SAVE_EDITOR,
				({ shouldShowToast }) => {
					reconcileServerState(shouldShowToast);
					return false;
				},
				COMMAND_PRIORITY_CRITICAL
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

							const wordId = wordNode.getDatabaseId();
							if (!wordId) return;

							const isAutoFill = wordNode.getIsAutoFill();

							appendWord({
								key: nodeKey,
								word: {
									databaseId: wordId,
									isAutoFill,
								},
							});
						});
					}
					if (mutation === "destroyed") {
					}
				}
			}),
			editor.registerMutationListener(GrammarPointTitleNode, (mutatedNodes) => {
				editor.getEditorState().read(() => {
					for (const [nodeKey, mutation] of mutatedNodes) {
						const grammarPointTitleNode = $getNodeByKey(nodeKey);
						if (!$isGrammarPointTitleNode(grammarPointTitleNode)) continue;
						generateGrammarPointMutation(grammarPointTitleNode, mutation);
					}
				});
			}),
			editor.registerMutationListener(SentenceNode, (mutatedNodes) => {
				editor.getEditorState().read(() => {
					for (const [nodeKey, mutation] of mutatedNodes) {
						const sentenceNode = $getNodeByKey(nodeKey);
						if (!$isSentenceNode(sentenceNode)) return;
						generateSentenceMutation(sentenceNode, mutation);
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
		generateGrammarPointMutation,
		generateSentenceMutation,
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
