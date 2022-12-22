import { useState, useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { trpc } from "@utils/trpc";
import { $getRoot } from "lexical";

const FetchDocumentPlugin = ({ id }: { id?: string }) => {
	const [editor] = useLexicalComposerContext();
	const [shouldFetch, setShouldFetch] = useState(false);
	trpc.document.getById.useQuery(id || "", {
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

	return null;
};

export default FetchDocumentPlugin;
