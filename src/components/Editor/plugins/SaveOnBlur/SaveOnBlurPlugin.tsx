import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect } from "react";
import { SAVE_EDITOR } from "../SaveToDBPlugin/SaveToDBPlugin";

const SaveOnBlurPlugin = () => {
	const [editor] = useLexicalComposerContext();

	const saveOnBlurHandler = useCallback(() => {
		editor.dispatchCommand(SAVE_EDITOR, { shouldShowToast: false });
	}, [editor]);

	useEffect(() => {
		window.addEventListener("blur", saveOnBlurHandler);
		return () => {
			window.removeEventListener("blur", saveOnBlurHandler);
		};
	}, [saveOnBlurHandler]);

	return null;
};

export default SaveOnBlurPlugin;
