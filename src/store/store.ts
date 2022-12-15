import type { SelectedBlockType } from "@components/Editor/plugins/SelectedBlockTypePlugin/SelectedBlockTypePlugin";
import create from "zustand";
import { devtools } from "zustand/middleware";

interface BearState {
	bears: number;
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
	increase: (by: number) => void;
	editorSelectedBlockType: SelectedBlockType;
	setEditorSelectedBlockType: (blockType: SelectedBlockType) => void;
}

const useBearStore = create<BearState>()(
	devtools(
		(set) => ({
			editorState: "",
			bears: 0,
			setEditorState: (newState) => set(() => ({ editorState: newState })),
			increase: (by) => set((state) => ({ bears: state.bears + by })),
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
			editorSelectedBlockType: "paragraph",
			setEditorSelectedBlockType: (blockType: SelectedBlockType) =>
				set(() => ({ editorSelectedBlockType: blockType })),
		}),
		{
			name: "editor-storage",
		}
	)
);

export default useBearStore;
