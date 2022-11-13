import create from "zustand";
import { devtools } from "zustand/middleware";

interface BearState {
	bears: number;
	editorState: string;
	setEditorState: (state: string) => void;
	increase: (by: number) => void;
}

const useBearStore = create<BearState>()(
	devtools(
		(set) => ({
			editorState: "",
			bears: 0,
			setEditorState: (newState) => set((state) => ({ editorState: newState })),
			increase: (by) => set((state) => ({ bears: state.bears + by })),
		}),
		{
			name: "bear-storage",
		}
	)
);

export default useBearStore;
