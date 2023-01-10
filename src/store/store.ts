import type { SelectedBlock } from "@components/Editor/plugins/SelectedBlockTypePlugin/SelectedBlockTypePlugin";
import create from "zustand";
import { devtools, persist } from "zustand/middleware";

type SelectedLanguage = {
	name: string;
	id: string;
};

interface EditorStore {
	editorState: string;
	editorFontSize: number;
	editorLineHeight: number;
	editorBackgroundOpacity: number;
	editorShowSpelling: boolean;
	setEditorState: (state: string) => void;
	setEditorFontSize: (state: number) => void;
	setEditorLineHeight: (state: number) => void;
	setEditorBackgroundOpacity: (state: number) => void;
	setEditorShowSpelling: (state: boolean) => void;
	editorSelectedBlock: SelectedBlock;
	setEditorSelectedBlock: (selectedBlock: SelectedBlock) => void;
	selectedLanguage: { id: string; name: string };
	setSelectedLanguage: (language: SelectedLanguage) => void;
}

const useEditorStore = create<EditorStore>()(
	devtools(
		persist(
			(set) => ({
				editorState: "",
				selectedLanguage: { id: "default", name: "Default" },
				setSelectedLanguage: (language: SelectedLanguage) =>
					set(() => ({ selectedLanguage: language })),
				setEditorState: (newState) => set(() => ({ editorState: newState })),
				editorFontSize: 40,
				setEditorFontSize: (fontSize: number) =>
					set(() => ({ editorFontSize: fontSize })),
				editorLineHeight: 40,
				setEditorLineHeight: (lineHeight: number) =>
					set(() => ({ editorLineHeight: lineHeight })),
				editorBackgroundOpacity: 20,
				setEditorBackgroundOpacity: (opacity: number) =>
					set(() => ({ editorBackgroundOpacity: opacity })),
				editorShowSpelling: false,
				setEditorShowSpelling: (showSpelling: boolean) =>
					set(() => ({ editorShowSpelling: showSpelling })),
				editorSelectedBlock: { type: "paragraph", key: "", layoutMode: "full" },
				setEditorSelectedBlock: (selectedBlock: SelectedBlock) =>
					set(() => ({ editorSelectedBlock: selectedBlock })),
			}),
			{
				name: "editor-storage",
			}
		)
	)
);

export default useEditorStore;
