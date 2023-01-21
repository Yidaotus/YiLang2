import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import useEditorSettingsStore from "@store/store";
import { useCallback, useEffect } from "react";
import { RECONCILE_AND_SAVE_EDITOR } from "../IndexElementsPlugin/IndexElementsPlugin";

const SaveOnBlurPlugin = () => {
	const [editor] = useLexicalComposerContext();
	const saveOnBlur = useEditorSettingsStore((state) => state.editorSaveOnBlur);

	const saveOnBlurHandler = useCallback(() => {
		if (saveOnBlur) {
			editor.dispatchCommand(RECONCILE_AND_SAVE_EDITOR, {
				shouldShowToast: false,
			});
		}
	}, [editor, saveOnBlur]);

	useEffect(() => {
		window.addEventListener("blur", saveOnBlurHandler);
		return () => {
			window.removeEventListener("blur", saveOnBlurHandler);
		};
	}, [saveOnBlurHandler]);

	return null;
};

export default SaveOnBlurPlugin;
