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
	editorSaveOnBlur: boolean;
	editorSelectedBlock: SelectedBlock;
	selectedLanguage: { id: string; name: string };
	actions: {
		setEditorState: (state: string) => void;
		setEditorFontSize: (state: number) => void;
		setEditorLineHeight: (state: number) => void;
		setEditorBackgroundOpacity: (state: number) => void;
		setEditorShowSpelling: (state: boolean) => void;
		setEditorMarkAllInstances: (state: boolean) => void;
		setEditorSelectedBlock: (selectedBlock: SelectedBlock) => void;
		setSelectedLanguage: (language: SelectedLanguage) => void;
		setEditorHideAutoFillWords: (hideAutoFill: boolean) => void;
		setEditorSaveOnBlur: (saveOnBlur: boolean) => void;
	};
}

const useEditorSettingsStore = create<EditorStore>()(
	devtools(
		persist(
			(set) => ({
				editorState: "",
				selectedLanguage: { id: "default", name: "Default" },
				editorFontSize: 40,
				editorLineHeight: 40,
				editorBackgroundOpacity: 20,
				editorShowSpelling: false,
				editorMarkAllInstances: false,
				editorHideAutoFillWords: false,
				editorSelectedBlock: {
					type: "paragraph",
					key: "",
					layoutMode: "full",
					sentenceKey: null,
				},
				editorSaveOnBlur: true,
				actions: {
					setEditorFontSize: (fontSize: number) =>
						set(() => ({ editorFontSize: fontSize })),
					setSelectedLanguage: (language: SelectedLanguage) =>
						set(() => ({ selectedLanguage: language })),
					setEditorState: (newState) => set(() => ({ editorState: newState })),
					setEditorLineHeight: (lineHeight: number) =>
						set(() => ({ editorLineHeight: lineHeight })),
					setEditorBackgroundOpacity: (opacity: number) =>
						set(() => ({ editorBackgroundOpacity: opacity })),
					setEditorShowSpelling: (showSpelling: boolean) =>
						set(() => ({ editorShowSpelling: showSpelling })),
					setEditorMarkAllInstances: (markAll: boolean) =>
						set(() => ({ editorMarkAllInstances: markAll })),
					setEditorHideAutoFillWords: (hideAutoFill: boolean) =>
						set(() => ({ editorHideAutoFillWords: hideAutoFill })),
					setEditorSelectedBlock: (selectedBlock: SelectedBlock) =>
						set(() => ({ editorSelectedBlock: selectedBlock })),
					setEditorSaveOnBlur: (saveOnBlur) =>
						set(() => ({ editorSaveOnBlur: saveOnBlur })),
				},
			}),
			{
				name: "editor-settings",
			}
		)
	)
);

export const useEditorSettingsActions = () =>
	useEditorSettingsStore((state) => state.actions);

export default useEditorSettingsStore;
