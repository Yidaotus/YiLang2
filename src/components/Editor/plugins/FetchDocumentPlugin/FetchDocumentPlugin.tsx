import { useState, useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { trpc } from "@utils/trpc";

const FetchDocumentPlugin = ({ id }: { id: string }) => {
	const [editor] = useLexicalComposerContext();
	const [shouldFetch, setShouldFetch] = useState(false);
	const editorDocument = trpc.document.getById.useQuery(id, {
		enabled: shouldFetch,
	});

	useEffect(() => {
		if (id) {
			setShouldFetch(true);
		}
	}, [id]);

	useEffect(() => {
		if (editorDocument.data) {
			setShouldFetch(false);
			const savedEditorState = editor.parseEditorState(
				editorDocument.data.serializedDocument
			);
			editor.setEditorState(savedEditorState);
		}
	}, [editor, editorDocument, shouldFetch]);

	return null;
};

export default FetchDocumentPlugin;
