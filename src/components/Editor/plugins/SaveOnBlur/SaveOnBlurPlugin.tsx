import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import useEditorSettingsStore from "@store/store";
import { useCallback, useEffect } from "react";
import { SAVE_EDITOR } from "../SaveToDBPlugin/SaveToDBPlugin";

const SaveOnBlurPlugin = () => {
	const [editor] = useLexicalComposerContext();
	const saveOnBlur = useEditorSettingsStore((state) => state.editorSaveOnBlur);

	const saveOnBlurHandler = useCallback(() => {
		if (saveOnBlur) {
			editor.dispatchCommand(SAVE_EDITOR, {
				shouldShowToast: false,
				notifyWhenDone: () => {
					console.debug("Saving on Blur");
				},
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
