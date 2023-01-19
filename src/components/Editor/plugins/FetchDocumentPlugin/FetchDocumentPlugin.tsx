import { Box, Spinner } from "@chakra-ui/react";
import { HIGHLIGHT_NODE_COMMAND } from "@components/Editor/Editor";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { trpc } from "@utils/trpc";
import { $getRoot, CLEAR_EDITOR_COMMAND, createCommand } from "lexical";
import router from "next/router";
import { useEffect, useState } from "react";

export const DOCUMENT_LOADED_COMMAND = createCommand<void>(
	"DOCUMENT_LOADED_COMMAND"
);

const FetchDocumentPlugin = ({ documentId }: { documentId: string }) => {
	const [editor] = useLexicalComposerContext();
	const [shouldFetch, setShouldFetch] = useState(false);
	const { highlight } = router.query;

	const documentQuery = trpc.document.getById.useQuery(documentId, {
		enabled: !!documentId && shouldFetch,
		onSuccess(data) {
			setShouldFetch(false);
			if (data) {
				editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
				if (data.serializedDocument) {
					const savedEditorState = editor.parseEditorState(
						data.serializedDocument
					);
					editor.setEditorState(savedEditorState);
					console.log("Loading finished");
				} else {
					editor.update(() => {
						$getRoot().clear();
					});
				}
				editor.dispatchCommand(DOCUMENT_LOADED_COMMAND, undefined);
				if (highlight) {
					if (Array.isArray(highlight)) {
						if (highlight[0]) {
							editor.dispatchCommand(HIGHLIGHT_NODE_COMMAND, highlight[0]);
						}
					} else {
						editor.dispatchCommand(HIGHLIGHT_NODE_COMMAND, highlight);
					}
				}
			}
		},
	});

	useEffect(() => {
		if (documentId) {
			setShouldFetch(true);
		}
	}, [documentId]);

	return (
		<>
			{documentQuery.isLoading && (
				<Box
					w="100%"
					h="100vh"
					bg="rgba(0,0,0,0.4)"
					display="flex"
					alignItems="center"
					justifyContent="center"
					pos="fixed"
					left="0"
					top="0"
					zIndex={50}
				>
					<Spinner color="brand.500" w="150px" h="150px" />
				</Box>
			)}
		</>
	);
};

export default FetchDocumentPlugin;
