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
	editorMarkAllInstances: boolean;
	editorHideAutoFillWords: boolean;
	setEditorState: (state: string) => void;
	setEditorFontSize: (state: number) => void;
	setEditorLineHeight: (state: number) => void;
	setEditorBackgroundOpacity: (state: number) => void;
	setEditorShowSpelling: (state: boolean) => void;
	setEditorMarkAllInstances: (state: boolean) => void;
	editorSelectedBlock: SelectedBlock;
	setEditorSelectedBlock: (selectedBlock: SelectedBlock) => void;
	selectedLanguage: { id: string; name: string };
	setSelectedLanguage: (language: SelectedLanguage) => void;
	setEditorHideAutoFillWords: (hideAutoFill: boolean) => void;
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
				editorMarkAllInstances: false,
				setEditorMarkAllInstances: (markAll: boolean) =>
					set(() => ({ editorMarkAllInstances: markAll })),
				editorHideAutoFillWords: false,
				setEditorHideAutoFillWords: (hideAutoFill: boolean) =>
					set(() => ({ editorHideAutoFillWords: hideAutoFill })),
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
