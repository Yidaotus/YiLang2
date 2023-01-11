import {
	Box,
	Button,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	useToken,
} from "@chakra-ui/react";
import { blockTypes } from "@components/Editor/utils/blockTypeFormatters";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import useEditorStore from "@store/store";
import { IoChevronDown } from "react-icons/io5";
import { RiParagraph } from "react-icons/ri";
import shallow from "zustand/shallow";

const FormatterMenu = () => {
	const [text400] = useToken("colors", ["text.400"]);
	const [editor] = useLexicalComposerContext();
	const { type: editorSelectedBlockType } = useEditorStore(
		(state) => state.editorSelectedBlock,
		shallow
	);

	return (
		<Menu placement="left">
			<MenuButton
				variant="ghost"
				as={Button}
				rightIcon={<IoChevronDown color={text400} />}
				gridColumn="span 2"
			>
				<Box minW="18" minH="18" w="18" h="18" color="text.400">
					{blockTypes[editorSelectedBlockType]?.icon || (
						<RiParagraph
							color="#696F80"
							style={{
								height: "24px",
								width: "24px",
							}}
						/>
					)}
				</Box>
			</MenuButton>
			<MenuList>
				{Object.entries(blockTypes)
					.filter(([key]) => key !== editorSelectedBlockType)
					.map(([key, block]) => (
						<MenuItem
							key={key}
							icon={
								<Box w="18" h="18" color="#696F80">
									{block.icon}
								</Box>
							}
							color="#40454f"
							onClick={() =>
								block.formatter({
									editor,
									currentBlockType: editorSelectedBlockType,
								})
							}
						>
							{block.type}
						</MenuItem>
					))}
			</MenuList>
		</Menu>
	);
};
export default FormatterMenu;
