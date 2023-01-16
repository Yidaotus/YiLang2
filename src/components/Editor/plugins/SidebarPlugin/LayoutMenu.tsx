import { ButtonGroup, IconButton } from "@chakra-ui/react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import useEditorStore from "@store/store";
import { RiSwapBoxLine } from "react-icons/ri";
import { RxColumns, RxRows } from "react-icons/rx";
import shallow from "zustand/shallow";
import {
	SET_LAYOUT_MODE_FULL,
	SET_LAYOUT_MODE_SPLIT,
	SWAP_SPLIT_COLUMNS,
} from "../SplitLayoutPlugin/SplitLayoutPlugin";

const LayoutMenu = () => {
	const [editor] = useLexicalComposerContext();
	const layoutMode = useEditorStore(
		(state) => state.editorSelectedBlock.layoutMode,
		shallow
	);
	const swapSplitLayout = () => {
		editor.dispatchCommand(SWAP_SPLIT_COLUMNS, undefined);
	};

	const setLayoutModeSplit = () => {
		editor.dispatchCommand(SET_LAYOUT_MODE_SPLIT, undefined);
	};

	const setLayoutModeFull = () => {
		editor.dispatchCommand(SET_LAYOUT_MODE_FULL, undefined);
	};

	return (
		<>
			<IconButton
				aria-label="Appereance"
				color="text.400"
				disabled={layoutMode !== "split"}
				onClick={() => swapSplitLayout()}
				icon={<RiSwapBoxLine />}
				gridColumn="span 2"
				variant="ghost"
			/>
			<ButtonGroup isAttached gridColumn="span 2">
				<IconButton
					w="100%"
					aria-label="multi column"
					icon={<RxColumns />}
					variant="ghost"
					isActive={layoutMode === "split"}
					onClick={setLayoutModeSplit}
				/>
				<IconButton
					w="100%"
					aria-label="single column"
					icon={<RxRows />}
					variant="ghost"
					isActive={layoutMode === "full"}
					onClick={setLayoutModeFull}
				/>
			</ButtonGroup>
		</>
	);
};

export default LayoutMenu;
