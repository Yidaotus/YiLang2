import type { ToastId } from "@chakra-ui/react";
import type { LexicalNode } from "lexical";
import { $isElementNode, $isLeafNode } from "lexical";

import { useToast } from "@chakra-ui/react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isHeadingNode } from "@lexical/rich-text";
import useEditorSettingsStore from "@store/store";
import { trpc } from "@utils/trpc";
import { $getRoot, COMMAND_PRIORITY_LOW, createCommand } from "lexical";
import { useCallback, useEffect } from "react";
import { RECONCILE_EDITOR_COMMAND } from "../IndexElementsPlugin/IndexElementsPlugin";

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

export const SAVE_EDITOR = createCommand<{
	shouldShowToast: boolean;
	notifyWhenDone: () => void;
}>("SAVE_EDITOR");
// const DELAY = 1000;

// const previousSaveMap = new Map<string, SaveableNode>();

const SaveToDBPlugin = ({ documentId }: { documentId: string }) => {
	const [editor] = useLexicalComposerContext();
	// const showToast = useRef(false);
	const toast = useToast();
	const trpcUtils = trpc.useContext();

	const upsertDocument = trpc.document.upsertDocument.useMutation();
	// const toastState = useRef<{ id: ToastId; timestamp: number } | null>(null);
	// const upsertDocument = trpc.document.upsertDocument.useMutation({
	// 	onMutate() {
	// 		if (showToast.current) {
	// 			const id = toast({
	// 				title: "Saving",
	// 				description: "Saving document",
	// 				status: "loading",
	// 				isClosable: true,
	// 			});
	// 			toastState.current = { id, timestamp: Date.now() };
	// 		}
	// 	},
	// 	onError() {
	// 		if (toastState.current) {
	// 			toast.close(toastState.current.id);
	// 		}
	// 		if (showToast.current) {
	// 			toast({
	// 				title: "Saving",
	// 				description: "Error while saving document.",
	// 				status: "error",
	// 				isClosable: true,
	// 			});
	// 		}
	// 	},
	// 	onSuccess() {
	// 		if (toastState.current && showToast.current) {
	// 			const delta = Math.max(
	// 				0,
	// 				DELAY - (Date.now() - toastState.current.timestamp)
	// 			);
	// 			const toastId = toastState.current.id;
	// 			setTimeout(() => {
	// 				toast.close(toastId);
	// 				toast({
	// 					title: "Saving",
	// 					description: "Document saved.",
	// 					status: "success",
	// 					isClosable: true,
	// 				});
	// 			}, delta);
	// 		}
	// 	},
	// });

	const selectedLanguage = useEditorSettingsStore(
		(store) => store.selectedLanguage
	);

	const reconcileAndSave = useCallback(
		async ({
			shouldShowToast,
			notifyWhenDone,
		}: {
			shouldShowToast: boolean;
			notifyWhenDone: () => void;
		}) => {
			let toastId: ToastId | null = null;
			if (shouldShowToast) {
				toastId = toast({
					title: "Saving",
					description: "Saving document",
					status: "loading",
					isClosable: true,
				});
			}

			const waitForReconcile = new Promise<void>((resolve) => {
				editor.dispatchCommand(RECONCILE_EDITOR_COMMAND, {
					notifyWhenDone: resolve,
				});
			});
			await waitForReconcile;
			editor.getEditorState().read(async () => {
				const serializedState = JSON.stringify(editor.getEditorState());
				const root = $getRoot();
				const rootElements = root.getChildren();
				let title = "";
				for (const node of rootElements) {
					if ($isHeadingNode(node) && !title) {
						title = node.getTextContent();
					}
				}
				await upsertDocument
					.mutateAsync({
						id: documentId,
						title,
						serializedDocument: serializedState,
						language: selectedLanguage.id,
					})
					.then(() => {
						trpcUtils.document.search.invalidate();
					});
				notifyWhenDone();
				if (toastId) {
					toast.close(toastId);
					toast({
						title: "Saving",
						description: "Document saved.",
						status: "success",
						isClosable: true,
					});
				}
			});
		},
		[
			documentId,
			editor,
			selectedLanguage.id,
			toast,
			trpcUtils.document.search,
			upsertDocument,
		]
	);

	useEffect(() => {
		return editor.registerCommand(
			SAVE_EDITOR,
			({ shouldShowToast, notifyWhenDone }) => {
				reconcileAndSave({ shouldShowToast, notifyWhenDone });
				return true;
			},
			COMMAND_PRIORITY_LOW
		);
	}, [
		documentId,
		editor,
		reconcileAndSave,
		selectedLanguage.id,
		trpcUtils.document.search,
		upsertDocument,
	]);

	return null;
};

export default SaveToDBPlugin;
