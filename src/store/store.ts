import type {
	SelectedBlock,
	SelectedBlockType,
} from "@components/Editor/plugins/SelectedBlockTypePlugin/SelectedBlockTypePlugin";
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
	editorSelectedBlock: SelectedBlock;
	setEditorSelectedBlock: (selectedBlock: SelectedBlock) => void;
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
			editorSelectedBlock: { type: "paragraph", key: "" },
			setEditorSelectedBlock: (selectedBlock: SelectedBlock) =>
				set(() => ({ editorSelectedBlock: selectedBlock })),
		}),
		{
			name: "editor-storage",
		}
	)
);

export default useBearStore;
