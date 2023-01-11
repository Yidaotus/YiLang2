import {
	Box,
	Divider,
	FormControl,
	FormLabel,
	IconButton,
	Popover,
	PopoverArrow,
	PopoverBody,
	PopoverContent,
	PopoverTrigger,
	Switch,
	Text,
	useToken,
} from "@chakra-ui/react";
import SettingsSlider from "@components/SettingsSlider";
import useEditorStore from "@store/store";
import {
	IoCheckmarkDone,
	IoGridOutline,
	IoLanguageOutline,
	IoSettings,
} from "react-icons/io5";
import { RiFontSize2, RiLineHeight } from "react-icons/ri";
import shallow from "zustand/shallow";

const SettingsMenu = () => {
	const {
		setEditorLineHeight,
		setEditorFontSize,
		setEditorBackgroundOpacity,
		setEditorShowSpelling,
		setEditorMarkAllInstances,
		editorShowSpelling,
		editorFontSize,
		editorBackgroundOpacity,
		editorLineHeight,
		editorMarkAllInstances,
	} = useEditorStore(
		(state) => ({
			setEditorLineHeight: state.setEditorLineHeight,
			setEditorFontSize: state.setEditorFontSize,
			setEditorBackgroundOpacity: state.setEditorBackgroundOpacity,
			setEditorShowSpelling: state.setEditorShowSpelling,
			setEditorMarkAllInstances: state.setEditorMarkAllInstances,
			editorShowSpelling: state.editorShowSpelling,
			editorFontSize: state.editorFontSize,
			editorBackgroundOpacity: state.editorBackgroundOpacity,
			editorLineHeight: state.editorLineHeight,
			editorMarkAllInstances: state.editorMarkAllInstances,
		}),
		shallow
	);
	const [text400] = useToken("colors", ["text.400"]);

	return (
		<Popover placement="left">
			<PopoverTrigger>
				<IconButton
					icon={<IoSettings size={20} color={text400} />}
					variant="ghost"
					aria-label="Appereance"
				/>
			</PopoverTrigger>
			<PopoverContent w="230px" mr={2}>
				<PopoverArrow />
				<PopoverBody>
					<Box
						display="flex"
						justifyContent="space-between"
						alignItems="center"
						pb={1}
					>
						<Text
							textTransform="uppercase"
							fontWeight="500"
							fontSize="14"
							color="text.300"
						>
							Font size
						</Text>
						<RiFontSize2 size={18} />
					</Box>
					<SettingsSlider value={editorFontSize} onChange={setEditorFontSize} />
					<Box
						display="flex"
						justifyContent="space-between"
						alignItems="center"
						pt={2}
						pb={1}
					>
						<Text
							textTransform="uppercase"
							fontWeight="500"
							fontSize="14"
							color="text.300"
						>
							Line height
						</Text>
						<RiLineHeight size={18} />
					</Box>
					<SettingsSlider
						value={editorLineHeight}
						onChange={setEditorLineHeight}
					/>
					<Box
						display="flex"
						justifyContent="space-between"
						alignItems="center"
						pt={2}
						pb={1}
					>
						<Text
							textTransform="uppercase"
							fontWeight="500"
							fontSize="14"
							color="text.300"
						>
							Background opacity
						</Text>
						<IoGridOutline size={18} />
					</Box>
					<SettingsSlider
						value={editorBackgroundOpacity}
						onChange={setEditorBackgroundOpacity}
					/>
					<Divider h={4} />
					<FormControl
						display="flex"
						alignItems="center"
						my={4}
						justifyContent="space-between"
					>
						<FormLabel
							htmlFor="show-spelling"
							mb="0"
							display="flex"
							gap={2}
							alignItems="center"
						>
							<IoLanguageOutline size={16} color={text400} />
							<Text
								textTransform="uppercase"
								fontWeight="500"
								fontSize="14"
								color="text.300"
							>
								Show spelling
							</Text>
						</FormLabel>
						<Switch
							colorScheme="brand"
							id="show-spelling"
							isChecked={editorShowSpelling}
							onChange={(e) => setEditorShowSpelling(e.target.checked)}
						/>
					</FormControl>
					<FormControl
						display="flex"
						alignItems="center"
						my={4}
						justifyContent="space-between"
					>
						<FormLabel
							htmlFor="mark-all-matches"
							mb="0"
							display="flex"
							gap={2}
							alignItems="center"
						>
							<IoCheckmarkDone size={16} color={text400} />
							<Text
								textTransform="uppercase"
								fontWeight="500"
								fontSize="14"
								color="text.300"
							>
								Mark all matches
							</Text>
						</FormLabel>
						<Switch
							colorScheme="brand"
							id="mark-all-matches"
							isChecked={editorMarkAllInstances}
							onChange={(e) => setEditorMarkAllInstances(e.target.checked)}
						/>
					</FormControl>
				</PopoverBody>
			</PopoverContent>
		</Popover>
	);
};

export default SettingsMenu;
