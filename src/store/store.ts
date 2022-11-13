import create from "zustand";
import { devtools } from "zustand/middleware";

interface BearState {
	bears: number;
	increase: (by: number) => void;
}

const useBearStore = create<BearState>()(
	devtools(
		(set) => ({
			bears: 0,
			increase: (by) => set((state) => ({ bears: state.bears + by })),
		}),
		{
			name: "bear-storage",
		}
	)
);

export default useBearStore;
