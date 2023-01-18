import type { ToastId } from "@chakra-ui/react";
import type { LexicalNode } from "lexical";
import { $isElementNode, $isLeafNode } from "lexical";

import { useToast } from "@chakra-ui/react";
import type SaveableNode from "@components/Editor/nodes/SaveableNode";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isHeadingNode } from "@lexical/rich-text";
import useEditorStore from "@store/store";
import { trpc } from "@utils/trpc";
import { $getRoot, COMMAND_PRIORITY_LOW, createCommand } from "lexical";
import { useCallback, useEffect, useRef } from "react";

export const $getAllNodesOfType = <T extends LexicalNode>(
	root: LexicalNode,
	finder: (node: LexicalNode) => node is LexicalNode & T
) => {
	const foundNodes: Array<T> = [];
	let rootElements: Array<LexicalNode> = [];
	if ($isElementNode(root)) {
		rootElements = root.getChildren();
	}
	for (const node of rootElements) {
		if (finder(node)) {
			foundNodes.push(node);
		}
		if (!$isLeafNode(node)) {
			const subNodes = $getAllNodesOfType(node, finder);
			foundNodes.push(...subNodes);
		}
	}
	return foundNodes;
};

export const SAVE_EDITOR = createCommand<{ shouldShowToast: boolean }>(
	"SAVE_EDITOR"
);
const DELAY = 1000;

const previousSaveMap = new Map<string, SaveableNode>();

const SaveToDBPlugin = ({ documentId }: { documentId: string }) => {
	const [editor] = useLexicalComposerContext();
	const showToast = useRef(false);
	const toast = useToast();
	const trpcUtils = trpc.useContext();

	const toastState = useRef<{ id: ToastId; timestamp: number } | null>(null);
	const upsertDocument = trpc.document.upsertDocument.useMutation({
		onMutate() {
			if (showToast.current) {
				const id = toast({
					title: "Saving",
					description: "Saving document",
					status: "loading",
					isClosable: true,
				});
				toastState.current = { id, timestamp: Date.now() };
			}
		},
		onError() {
			if (toastState.current) {
				toast.close(toastState.current.id);
			}
			if (showToast.current) {
				toast({
					title: "Saving",
					description: "Error while saving document.",
					status: "error",
					isClosable: true,
				});
			}
		},
		onSuccess() {
			if (toastState.current && showToast.current) {
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

	const saveAllNodes = useCallback(async (nodesToSave: Array<SaveableNode>) => {
		const saveMap = new Map<string, SaveableNode>();
		for (const nodeToSave of nodesToSave) {
			nodeToSave.saveToDatabase();
			/*
			if (nodeToSave.hasChangesForDatabase) {
				const databaseId = await nodeToSave.saveToDatabase();
				saveMap.set(databaseId, nodeToSave);
			}
			*/
		}

		const deleteMap = new Map<string, SaveableNode>();
		for (const [key, value] of previousSaveMap.entries()) {
			if (!saveMap.get(key)) {
				deleteMap.set(key, value);
			}
		}
	}, []);

	const selectedLanguage = useEditorStore((store) => store.selectedLanguage);

	useEffect(() => {
		return editor.registerCommand(
			SAVE_EDITOR,
			({ shouldShowToast }) => {
				showToast.current = shouldShowToast;
				const serializedState = JSON.stringify(editor.getEditorState());
				const root = $getRoot();
				const rootElements = root.getChildren();
				let title = "";
				for (const node of rootElements) {
					if ($isHeadingNode(node) && !title) {
						title = node.getTextContent();
					}
				}
				upsertDocument
					.mutateAsync({
						id: documentId,
						title,
						serializedDocument: serializedState,
						language: selectedLanguage.id,
					})
					.then(() => {
						trpcUtils.document.search.invalidate();
					});

				return true;
			},
			COMMAND_PRIORITY_LOW
		);
	}, [
		documentId,
		editor,
		selectedLanguage.id,
		trpcUtils.document.search,
		upsertDocument,
	]);

	return null;
};

export default SaveToDBPlugin;
