import type { ToastId } from "@chakra-ui/react";
import { Box, Divider, IconButton, useToast, useToken } from "@chakra-ui/react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isHeadingNode } from "@lexical/rich-text";
import useEditorStore from "@store/store";
import { trpc } from "@utils/trpc";
import { $getRoot } from "lexical";
import { useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { IoSaveOutline } from "react-icons/io5";
import FormatterMenu from "./FormatterMenu";
import LayoutMenu from "./LayoutMenu";
import SettingsMenu from "./SettingsMenu";
import WordList from "./WordList";

type SidebarPluginProps = {
	sidebarPortal: HTMLElement;
	documentId?: string;
};
const DELAY = 1000;
const SidebarPlugin = ({ sidebarPortal, documentId }: SidebarPluginProps) => {
	const toast = useToast();

	const [text400] = useToken("colors", ["text.400"]);
	const [editor] = useLexicalComposerContext();
	const toastState = useRef<{ id: ToastId; timestamp: number } | null>(null);
	const selectedLanguage = useEditorStore((state) => state.selectedLanguage);

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

	const saveDocument = useCallback(async () => {
		const serializedState = JSON.stringify(editor.getEditorState());
		editor.getEditorState().read(() => {
			const root = $getRoot();
			const rootElements = root.getChildren();
			let title = "";
			for (const node of rootElements) {
				if ($isHeadingNode(node)) {
					title = node.getTextContent();
					break;
				}
			}
			upsertDocument.mutate({
				id: documentId,
				title,
				serializedDocument: serializedState,
				language: selectedLanguage.id,
			});
		});
	}, [documentId, editor, selectedLanguage, upsertDocument]);

	return createPortal(
		<Box
			w="100%"
			pos="relative"
			display="grid"
			gridTemplateColumns="1fr 1fr"
			gap="4px"
			pt="1rem"
		>
			<Divider
				borderWidth="2px"
				borderRadius="3px"
				mb="0.5rem"
				gridColumn="span 2"
			/>
			<FormatterMenu />
			<SettingsMenu />
			<IconButton
				disabled={upsertDocument.isLoading}
				icon={
					<IoSaveOutline
						color={text400}
						style={{
							height: "24px",
							width: "24px",
						}}
					/>
				}
				variant="ghost"
				color="text.500"
				aria-label="Bold"
				onClick={saveDocument}
			/>
			<Divider
				borderWidth="2px"
				borderRadius="3px"
				mb="0.5rem"
				gridColumn="span 2"
			/>
			<WordList />
			<Divider
				borderWidth="2px"
				borderRadius="3px"
				mb="0.5rem"
				gridColumn="span 2"
			/>
			<LayoutMenu />
		</Box>,
		sidebarPortal
	);
};

export default SidebarPlugin;
