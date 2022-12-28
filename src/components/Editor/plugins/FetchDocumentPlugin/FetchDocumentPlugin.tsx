import { useState, useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { trpc } from "@utils/trpc";
import { $getRoot } from "lexical";
import { Box, Spinner } from "@chakra-ui/react";

const FetchDocumentPlugin = ({ id }: { id?: string }) => {
	const [editor] = useLexicalComposerContext();
	const [shouldFetch, setShouldFetch] = useState(false);
	const documentQuery = trpc.document.getById.useQuery(id || "", {
		enabled: !!id && shouldFetch,
		onSuccess(data) {
			setShouldFetch(false);
			if (data) {
				if (data.serializedDocument) {
					const savedEditorState = editor.parseEditorState(
						data.serializedDocument
					);
					editor.setEditorState(savedEditorState);
				} else {
					editor.update(() => {
						$getRoot().clear();
					});
				}
			}
		},
	});

	useEffect(() => {
		if (id) {
			setShouldFetch(true);
		}
	}, [id]);

	/*
	useEffect(() => {
		if (editorDocument.data && shouldFetch) {
			if (editorDocument.data.serializedDocument) {
			}
		}
	}, [editor, editorDocument, shouldFetch]);
*/

	return (
		<>
			{documentQuery.isLoading && (
				<Box
					w="100vw"
					h="100vh"
					bg="rgba(0,0,0,0.4)"
					display="flex"
					alignItems="center"
					justifyContent="center"
					pos="fixed"
					left="60px"
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
