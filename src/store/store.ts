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
}

const useBearStore = create<BearState>()(
	devtools(
		(set) => ({
			editorState: "",
			bears: 0,
			setEditorState: (newState) => set(() => ({ editorState: newState })),
			increase: (by) => set((state) => ({ bears: state.bears + by })),
			editorFontSize: 20,
			setEditorFontSize: (fontSize: number) =>
				set(() => ({ editorFontSize: fontSize })),
			editorLineHeight: 20,
			setEditorLineHeight: (lineHeight: number) =>
				set(() => ({ editorLineHeight: lineHeight })),
			editorBackgroundOpacity: 20,
			setEditorBackgroundOpacity: (opacity: number) =>
				set(() => ({ editorBackgroundOpacity: opacity })),
			editorShowSpelling: true,
			setEditorShowSpelling: (showSpelling: boolean) =>
				set(() => ({ editorShowSpelling: showSpelling })),
		}),
		{
			name: "editor-storage",
		}
	)
);

export default useBearStore;
