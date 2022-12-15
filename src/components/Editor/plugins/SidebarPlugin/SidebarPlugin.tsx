import {
	Button,
	Checkbox,
	Divider,
	IconButton,
	Popover,
	PopoverArrow,
	PopoverBody,
	PopoverCloseButton,
	PopoverContent,
	PopoverHeader,
	PopoverTrigger,
	Slider,
	SliderFilledTrack,
	SliderMark,
	SliderThumb,
	SliderTrack,
	Text,
} from "@chakra-ui/react";
import { Box } from "@chakra-ui/react";
import { $isHeadingNode } from "@lexical/rich-text";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { trpc } from "@utils/trpc";
import { $getRoot } from "lexical";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import {
	IoGrid,
	IoGridOutline,
	IoImage,
	IoImageOutline,
	IoLanguageOutline,
	IoSaveOutline,
	IoSettings,
} from "react-icons/io5";
import { RxFontBold, RxFontSize, RxOpacity, RxTransform } from "react-icons/rx";
import { RiFontSize, RiFontSize2, RiLineHeight } from "react-icons/ri";
import useBearStore from "@store/store";

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
			bg="#fafaf9"
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

type StepOptionArray<T> = Array<{ step: 0 | 20 | 40 | 60 | 80; option: T }>;

const EditorFontSizeOptions: StepOptionArray<number> = [
	{ step: 0, option: 16 },
	{ step: 20, option: 18 },
	{ step: 40, option: 20 },
	{ step: 60, option: 22 },
	{ step: 80, option: 24 },
];

const EditorLineHeightOptions: StepOptionArray<string> = [
	{ step: 0, option: "0.5em" },
	{ step: 20, option: "0.8em" },
	{ step: 40, option: "1.0em" },
	{ step: 60, option: "1.1em" },
	{ step: 80, option: "1.2em" },
];

type SidebarPluginProps = {
	documentId?: string;
	sidebarPortal: HTMLElement;
};
const SidebarPlugin = ({ sidebarPortal, documentId }: SidebarPluginProps) => {
	const {
		setEditorLineHeight,
		setEditorFontSize,
		setEditorBackgroundOpacity,
		setEditorShowSpelling,
		editorShowSpelling,
		editorFontSize,
		editorBackgroundOpacity,
		editorLineHeight,
	} = useBearStore();
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
				gridColumn="span 2"
				borderWidth="2px"
				borderRadius="3px"
				mb="0.5rem"
			/>
			<IconButton
				icon={
					<RxFontBold
						color="#696F80"
						style={{
							height: "24px",
							width: "24px",
						}}
					/>
				}
				aria-label="Bold"
				variant="ghost"
			/>
			<IconButton
				icon={
					<RxFontBold
						color="#696F80"
						style={{
							height: "24px",
							width: "24px",
						}}
					/>
				}
				aria-label="Bold"
				variant="ghost"
			/>
			<IconButton
				icon={
					<RxFontBold
						color="#696F80"
						style={{
							height: "24px",
							width: "24px",
						}}
					/>
				}
				aria-label="Bold"
				variant="ghost"
			/>
			<IconButton
				icon={
					<RxFontBold
						color="#696F80"
						style={{
							height: "24px",
							width: "24px",
						}}
					/>
				}
				aria-label="Bold"
				variant="ghost"
			/>
			<IconButton
				icon={
					<RxFontBold
						color="#696F80"
						style={{
							height: "24px",
							width: "24px",
						}}
					/>
				}
				aria-label="Bold"
				variant="ghost"
			/>
			<Divider
				gridColumn="span 2"
				borderWidth="2px"
				borderRadius="3px"
				mb="0.5rem"
			/>
			<IconButton
				icon={
					<IoSaveOutline
						color="#696F80"
						style={{
							height: "24px",
							width: "24px",
						}}
					/>
				}
				aria-label="Bold"
				variant="ghost"
				onClick={saveDocument}
			/>
			<Divider
				gridColumn="span 2"
				borderWidth="2px"
				borderRadius="3px"
				mb="0.5rem"
			/>
			<Popover placement="left">
				<PopoverTrigger>
					<IconButton
						gridColumn="span 2"
						icon={<IoSettings size={20} />}
						color="text.500"
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
						<SettingsSlider
							value={editorFontSize}
							onChange={setEditorFontSize}
						/>
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
							defaultChecked
							flexDirection="row-reverse"
							justifyContent="space-between"
							w="100%"
							colorScheme="brand"
							color="text.400"
							bg="#fafaf9"
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
		</Box>,
		sidebarPortal
	);
};

export default SidebarPlugin;
