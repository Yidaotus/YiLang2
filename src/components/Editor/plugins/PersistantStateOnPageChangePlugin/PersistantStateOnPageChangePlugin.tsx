import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import useEditorStore from "@store/store";
import { useRouter } from "next/router";
import { useEffect } from "react";

const PersistStateOnPageChangePlugion = () => {
	const [editor] = useLexicalComposerContext();
	const editorState = useEditorStore((state) => state.editorState);
	const setEditorState = useEditorStore((state) => state.setEditorState);
	const router = useRouter();

	useEffect(() => {
		if (editorState) {
			const savedEditorState = editor.parseEditorState(editorState);
			editor.setEditorState(savedEditorState);
		}
	}, [editor, editorState]);

	useEffect(() => {
		const handleRouteChange = () => {
			setEditorState(JSON.stringify(editor.getEditorState()));
		};

		router.events.on("routeChangeStart", handleRouteChange);
		return () => {
			router.events.off("routeChangeStart", handleRouteChange);
		};
	}, [editor, router, setEditorState]);

	return null;
};

export default PersistStateOnPageChangePlugion;
