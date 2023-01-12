import type { ToastId } from "@chakra-ui/react";
import type { LexicalNode, RootNode } from "lexical";

import { useToast } from "@chakra-ui/react";
import { $isGrammarPointContainerNode } from "@components/Editor/nodes/GrammarPoint/GrammarPointContainerNode";
import { $isGrammarPointTitleNode } from "@components/Editor/nodes/GrammarPoint/GrammarPointTitleNode";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isHeadingNode } from "@lexical/rich-text";
import useEditorStore from "@store/store";
import { trpc } from "@utils/trpc";
import {
	$getRoot,
	$isRootOrShadowRoot,
	COMMAND_PRIORITY_LOW,
	createCommand,
} from "lexical";
import { useEffect, useRef } from "react";

const $getAllNodesOfType = <T extends LexicalNode>(
	root: RootNode,
	finder: (node: LexicalNode) => node is T
) => {
	const foundNodes: Array<T> = [];
	const rootElements = root.getChildren();
	for (const node of rootElements) {
		if ($isRootOrShadowRoot(node)) {
			const subNodes = $getAllNodesOfType(node as RootNode, finder);
			foundNodes.push(...subNodes);
		}
		if (finder(node)) {
			foundNodes.push(node);
		}
	}
	return foundNodes;
};

export const SAVE_EDITOR = createCommand("SAVE_EDITOR");
const DELAY = 1000;

const SaveToDBPlugin = ({ documentId }: { documentId: string }) => {
	const [editor] = useLexicalComposerContext();
	const toast = useToast();
	const toastState = useRef<{ id: ToastId; timestamp: number } | null>(null);
	const upsertGrammarPoint = trpc.dictionary.upsertGrammarPoint.useMutation();
	const upsertDocument = trpc.document.upsertDocument.useMutation({
		onMutate() {
			const id = toast({
				title: "Saving",
				description: "Saving document",
				status: "loading",
				isClosable: true,
			});
			toastState.current = { id, timestamp: Date.now() };
		},
		onError() {
			if (toastState.current) {
				toast.close(toastState.current.id);
			}
			toast({
				title: "Saving",
				description: "Error while saving document.",
				status: "error",
				isClosable: true,
			});
		},
		onSuccess() {
			if (toastState.current) {
				const delta = Math.max(
					0,
					DELAY - (Date.now() - toastState.current.timestamp)
				);
				const toastId = toastState.current.id;
				setTimeout(() => {
					toast.close(toastId);
					toast({
						title: "Saving",
						description: "Document saved.",
						status: "success",
						isClosable: true,
					});
				}, delta);
			}
		},
	});
	const selectedLanguage = useEditorStore((store) => store.selectedLanguage);

	useEffect(() => {
		return editor.registerCommand(
			SAVE_EDITOR,
			() => {
				const serializedState = JSON.stringify(editor.getEditorState());
				const root = $getRoot();
				const rootElements = root.getChildren();
				let title = "";
				for (const node of rootElements) {
					if ($isHeadingNode(node) && !title) {
						title = node.getTextContent();
					}
				}

				const grammarPointNodes = $getAllNodesOfType(
					root,
					$isGrammarPointContainerNode
				);

				for (const grammarNode of grammarPointNodes) {
					const titleNode = grammarNode.getChildren()[0];
					if (!$isGrammarPointTitleNode(titleNode)) {
						continue;
					}

					const title = titleNode.getTextContent();
					const id = grammarNode.getId();

					upsertGrammarPoint
						.mutateAsync({
							id: id || undefined,
							sourceDocumentId: documentId,
							title,
						})
						.then((gp) => {
							editor.update(() => {
								grammarNode.setId(gp.id);
							});
						});
				}

				upsertDocument.mutate({
					id: documentId,
					title,
					serializedDocument: serializedState,
					language: selectedLanguage.id,
				});

				return true;
			},
			COMMAND_PRIORITY_LOW
		);
	}, [
		documentId,
		editor,
		selectedLanguage.id,
		upsertDocument,
		upsertGrammarPoint,
	]);

	return null;
};

export default SaveToDBPlugin;
