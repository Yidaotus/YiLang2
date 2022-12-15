import { Divider, IconButton } from "@chakra-ui/react";
import { Box } from "@chakra-ui/react";
import { $isHeadingNode } from "@lexical/rich-text";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { trpc } from "@utils/trpc";
import { $getRoot } from "lexical";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { createPortal } from "react-dom";
import { IoSaveOutline } from "react-icons/io5";
import { RxFontBold } from "react-icons/rx";

type SidebarPluginProps = {
	documentId?: string;
	sidebarPortal: HTMLElement;
};
const SidebarPlugin = ({ sidebarPortal, documentId }: SidebarPluginProps) => {
	const router = useRouter();
	const [editor] = useLexicalComposerContext();

	const upsertDocument = trpc.document.upsertDocument.useMutation({
		onSuccess: (data) => {
			if (!documentId) {
				router.push(`/editor/${data.id}`);
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
			});
		});
	}, [documentId, editor, upsertDocument]);

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
				gridColumn="span 2"
				borderWidth="2px"
				borderRadius="3px"
				mb="0.5rem"
			/>
			<IconButton
				icon={
					<RxFontBold
						color="#696F80"
						style={{
							height: "24px",
							width: "24px",
						}}
					/>
				}
				aria-label="Bold"
				variant="ghost"
			/>
			<IconButton
				icon={
					<RxFontBold
						color="#696F80"
						style={{
							height: "24px",
							width: "24px",
						}}
					/>
				}
				aria-label="Bold"
				variant="ghost"
			/>
			<IconButton
				icon={
					<RxFontBold
						color="#696F80"
						style={{
							height: "24px",
							width: "24px",
						}}
					/>
				}
				aria-label="Bold"
				variant="ghost"
			/>
			<IconButton
				icon={
					<RxFontBold
						color="#696F80"
						style={{
							height: "24px",
							width: "24px",
						}}
					/>
				}
				aria-label="Bold"
				variant="ghost"
			/>
			<IconButton
				icon={
					<RxFontBold
						color="#696F80"
						style={{
							height: "24px",
							width: "24px",
						}}
					/>
				}
				aria-label="Bold"
				variant="ghost"
			/>
			<Divider
				gridColumn="span 2"
				borderWidth="2px"
				borderRadius="3px"
				mb="0.5rem"
			/>
			<IconButton
				icon={
					<IoSaveOutline
						color="#696F80"
						style={{
							height: "24px",
							width: "24px",
						}}
					/>
				}
				aria-label="Bold"
				variant="ghost"
				onClick={saveDocument}
			/>
		</Box>,
		sidebarPortal
	);
};

export default SidebarPlugin;
