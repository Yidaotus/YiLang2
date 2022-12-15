import {
	Button,
	Checkbox,
	Divider,
	IconButton,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	Popover,
	PopoverArrow,
	PopoverBody,
	PopoverContent,
	PopoverTrigger,
	Slider,
	SliderFilledTrack,
	SliderMark,
	SliderThumb,
	SliderTrack,
	Text,
	useToken,
} from "@chakra-ui/react";
import { Box } from "@chakra-ui/react";
import { $isHeadingNode } from "@lexical/rich-text";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { trpc } from "@utils/trpc";
import { $getRoot } from "lexical";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { createPortal } from "react-dom";
import {
	IoChevronDown,
	IoGridOutline,
	IoLanguageOutline,
	IoSaveOutline,
	IoSettings,
} from "react-icons/io5";
import { RiFontSize2, RiLineHeight, RiParagraph } from "react-icons/ri";
import useBearStore from "@store/store";
import shallow from "zustand/shallow";
import { blockTypes } from "@components/Editor/utils/blockTypeFormatters";

type SettingsSliderProps = {
	value: number;
	onChange: (newValue: number) => void;
};
const SettingsSlider = ({ value, onChange }: SettingsSliderProps) => {
	const maxValue = 100;
	const steps = [...new Array(5)].map((_, i) => i);

	return (
		<Box
			borderColor="text.100"
			borderWidth="1px"
			borderRadius="5px"
			py={2}
			px={3}
			display="flex"
			alignItems="center"
			bg="brand.50"
		>
			<Slider
				defaultValue={0}
				min={0}
				max={80}
				step={20}
				onChange={onChange}
				value={value}
			>
				{steps.map((step) => {
					const markValue = step * (maxValue / steps.length);
					return (
						<SliderMark
							key={step}
							value={markValue}
							borderColor={value >= markValue ? "brand.500" : "text.300"}
							borderWidth="4px"
							borderRadius="100%"
							transform="translate(-50%, -50%)"
						/>
					);
				})}
				<SliderTrack bg="text.300">
					<Box position="relative" right={10} />
					<SliderFilledTrack bg="brand.500" />
				</SliderTrack>
				<SliderThumb boxSize={4} borderColor="text.100" border="1px" />
			</Slider>
		</Box>
	);
};

const FormatterMenu = () => {
	const [text400] = useToken("colors", ["text.400"]);
	const [editor] = useLexicalComposerContext();
	const editorSelectedBlockType = useBearStore(
		(state) => state.editorSelectedBlockType
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
								block.formatter({ editor, editorSelectedBlockType })
							}
						>
							{block.type}
						</MenuItem>
					))}
			</MenuList>
		</Menu>
	);
};

const SettingsMenu = () => {
	const {
		setEditorLineHeight,
		setEditorFontSize,
		setEditorBackgroundOpacity,
		setEditorShowSpelling,
		editorShowSpelling,
		editorFontSize,
		editorBackgroundOpacity,
		editorLineHeight,
	} = useBearStore(
		(state) => ({
			setEditorLineHeight: state.setEditorLineHeight,
			setEditorFontSize: state.setEditorFontSize,
			setEditorBackgroundOpacity: state.setEditorBackgroundOpacity,
			setEditorShowSpelling: state.setEditorShowSpelling,
			editorShowSpelling: state.editorShowSpelling,
			editorFontSize: state.editorFontSize,
			editorBackgroundOpacity: state.editorBackgroundOpacity,
			editorLineHeight: state.editorLineHeight,
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
						pr={2}
						pb={1}
					>
						<Text color="text.300">Font size</Text>
						<RiFontSize2 size={18} />
					</Box>
					<SettingsSlider value={editorFontSize} onChange={setEditorFontSize} />
					<Box
						display="flex"
						justifyContent="space-between"
						alignItems="flex-end"
						pr={2}
						pt={2}
						pb={1}
					>
						<Text color="text.300">Line height</Text>
						<RiLineHeight size={18} />
					</Box>
					<SettingsSlider
						value={editorLineHeight}
						onChange={setEditorLineHeight}
					/>
					<Box
						display="flex"
						justifyContent="space-between"
						alignItems="flex-end"
						pr={2}
						pt={2}
						pb={1}
					>
						<Text color="text.300">Background opacity</Text>
						<IoGridOutline size={18} />
					</Box>
					<SettingsSlider
						value={editorBackgroundOpacity}
						onChange={setEditorBackgroundOpacity}
					/>
					<Divider h={4} />
					<Checkbox
						mt={4}
						py={1}
						px={2}
						checked={editorShowSpelling}
						onChange={(e) => setEditorShowSpelling(e.target.checked)}
						flexDirection="row-reverse"
						justifyContent="space-between"
						w="100%"
						colorScheme="brand"
						color="text.400"
						bg="brand.50"
						borderColor="text.100"
						borderWidth="1px"
						borderRadius="5px"
					>
						<Box display="flex" alignItems="center" gap={1}>
							<IoLanguageOutline size={18} />
							Show spelling
						</Box>
					</Checkbox>
				</PopoverBody>
			</PopoverContent>
		</Popover>
	);
};

type SidebarPluginProps = {
	documentId?: string;
	sidebarPortal: HTMLElement;
};
const SidebarPlugin = ({ sidebarPortal, documentId }: SidebarPluginProps) => {
	const [text400] = useToken("colors", ["text.400"]);
	const router = useRouter();
	const [editor] = useLexicalComposerContext();

	const upsertDocument = trpc.document.upsertDocument.useMutation({
		onSuccess: (data) => {
			if (!documentId) {
				router.push(`/editor/${data.id}`);
			}
		},
	});

	const saveDocument = useCallback(async () => {
		const serializedState = JSON.stringify(editor.getEditorState());
		editor.getEditorState().read(() => {
			const root = $getRoot();
			const rootElements = root.getChildren();
			let title = "";
			for (const node of rootElements) {
				if ($isHeadingNode(node)) {
					title = node.getTextContent();
					break;
				}
			}
			upsertDocument.mutate({
				id: documentId,
				title,
				serializedDocument: serializedState,
			});
		});
	}, [documentId, editor, upsertDocument]);

	return createPortal(
		<Box
			w="100%"
			pos="relative"
			display="grid"
			gridTemplateColumns="1fr 1fr"
			gap="4px"
			pt="1rem"
		>
			<Divider
				borderWidth="2px"
				borderRadius="3px"
				mb="0.5rem"
				gridColumn="span 2"
			/>
			<FormatterMenu />
			<SettingsMenu />
			<IconButton
				icon={
					<IoSaveOutline
						color={text400}
						style={{
							height: "24px",
							width: "24px",
						}}
					/>
				}
				variant="ghost"
				color="text.500"
				aria-label="Bold"
				onClick={saveDocument}
			/>
		</Box>,
		sidebarPortal
	);
};

export default SidebarPlugin;
