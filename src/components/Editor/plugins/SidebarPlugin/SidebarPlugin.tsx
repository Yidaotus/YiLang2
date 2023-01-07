import {
	Button,
	Divider,
	FormControl,
	FormLabel,
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
	Switch,
	Text,
	useToken,
} from "@chakra-ui/react";
import { Box } from "@chakra-ui/react";
import { $isHeadingNode } from "@lexical/rich-text";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { trpc } from "@utils/trpc";
import {
	$createNodeSelection,
	$getNodeByKey,
	$getRoot,
	$setSelection,
	LineBreakNode,
} from "lexical";
import router, { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
	IoChevronDown,
	IoGridOutline,
	IoLanguageOutline,
	IoSaveOutline,
	IoSettings,
} from "react-icons/io5";
import { RiFontSize2, RiLineHeight, RiParagraph } from "react-icons/ri";
import useEditorStore from "@store/store";
import shallow from "zustand/shallow";
import { blockTypes } from "@components/Editor/utils/blockTypeFormatters";
import { WordNode } from "@components/Editor/nodes/WordNode";
import Word from "@components/Word";
import FloatingContainer from "@components/Editor/ui/FloatingContainer";
import type { Middleware, ReferenceType } from "@floating-ui/react";
import useOnClickOutside from "@ui/hooks/useOnClickOutside";
import { useSession } from "next-auth/react";
import useLoadingToast from "@components/LoadingToast/LoadingToast";
import {
	INSERT_IMAGE_PARAGRAPH,
	SPLIT_PARAGRAPH,
} from "@components/Editor/Editor";

const clipTop: Middleware = {
	name: "clipToTop",
	fn({ y }) {
		if (y < -230) {
			return {
				y: y + (-230 - y),
			};
		}
		return {};
	},
};

const WordListPlugin = () => {
	const [text400] = useToken("colors", ["text.400"]);
	const [editor] = useLexicalComposerContext();
	const { highlight: targetWord } = router.query;
	const targetWordId = Array.isArray(targetWord) ? targetWord[0] : targetWord;
	//@TODO Idea pull out wordStore into plugin so other plugins can hook into it by bear
	const [wordStore, setWordStore] = useState<
		Record<string, string | undefined>
	>({});
	const buttonRef = useRef(null);
	const [popupReference, setPopupReference] = useState<ReferenceType | null>(
		null
	);
	const floatingRef = useRef(null);
	useOnClickOutside(floatingRef, () => {
		setPopupReference(null);
	});

	useEffect(() => {
		return editor.registerNodeTransform(LineBreakNode, (node) => {
			node.remove();
		});
	}, [editor]);

	useEffect(() => {
		/*
			editor.registerDecoratorListener<any>((decorators) => {
				setWordStore(
					Object.entries(decorators)
						.filter(([key, value]) => value?.props?.word)
						.map(([key, value]) => ({
							key,
							text: value.props.word,
						}))
				);
			})
			*/
		// Fixed in 0.6.5 see https://github.com/facebook/lexical/issues/3490
		return editor.registerMutationListener(WordNode, (mutatedNodes) => {
			for (const [nodeKey, mutation] of mutatedNodes) {
				if (mutation === "created") {
					editor.getEditorState().read(() => {
						const wordNode = $getNodeByKey(nodeKey) as WordNode;
						const wordId = wordNode.getId();
						setWordStore((currentStore) => ({
							...currentStore,
							[nodeKey]: wordId,
						}));
					});
				}
				if (mutation === "destroyed") {
					setWordStore((currentStore) => {
						delete currentStore[nodeKey];
						return { ...currentStore };
					});
				}
			}
		});
	}, [editor]);

	const highlightWord = useCallback(
		(key: string) => {
			if (key) {
				editor.update(() => {
					const nodeElem = editor.getElementByKey(key);
					if (nodeElem) {
						setPopupReference(null);
						const newSelection = $createNodeSelection();
						newSelection.add(key);
						$setSelection(newSelection);
						nodeElem.scrollIntoView({
							block: "center",
							inline: "nearest",
						});
					}
				});
			}
		},
		[editor]
	);

	useEffect(() => {
		if (targetWordId) {
			const targetInStore = Object.entries(wordStore).find(
				([key, wordId]) => targetWordId === wordId
			);
			if (targetInStore) {
				highlightWord(targetInStore[0]);
			}
		}
	}, [highlightWord, targetWordId, wordStore]);

	return (
		<>
			<Button
				leftIcon={<IoLanguageOutline size={20} color={text400} />}
				gridColumn="span 2"
				variant={!!popupReference ? "solid" : "ghost"}
				aria-label="Appereance"
				color="text.400"
				disabled={Object.entries(wordStore).length < 1}
				ref={buttonRef}
				onClick={() =>
					setPopupReference(popupReference ? null : buttonRef.current)
				}
			>
				Words
			</Button>
			<div ref={floatingRef}>
				<FloatingContainer
					popupPlacement="left"
					popupReference={popupReference}
					middlewares={[clipTop]}
					showArrow
				>
					<Box
						display="flex"
						flexDir="column"
						gap={4}
						maxW="350px"
						p={2}
						maxH="80vh"
						overflow="auto"
					>
						{Object.entries(wordStore).map(([nodeKey, wordId]) =>
							wordId ? (
								<Word
									border
									key={nodeKey}
									wordId={wordId}
									wordKey={nodeKey}
									clickHandler={() => highlightWord(nodeKey)}
								/>
							) : null
						)}
					</Box>
				</FloatingContainer>
			</div>
		</>
	);
};

type SettingsSliderProps = {
	value: number;
	onChange: (newValue: number) => void;
};
const SettingsSlider = ({ value, onChange }: SettingsSliderProps) => {
	const maxValue = 100;
	const steps = [...new Array(5)].map((_, i) => i);

	return (
		<Box
			//borderColor="text.100"
			//borderWidth="1px"
			borderRadius="5px"
			py={2}
			px={3}
			display="flex"
			alignItems="center"
			//bg="brand.50"
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

type SettingsState = {
	lineHeight: number;
	fontSize: number;
	backgroundOpacity: number;
	showSpelling: boolean;
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
	} = useEditorStore(
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
							checked={editorShowSpelling}
							onChange={(e) => setEditorShowSpelling(e.target.checked)}
						/>
					</FormControl>
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
	const [, setLoading] = useLoadingToast(false, {
		title: "Saving",
		position: "bottom-right",
	});

	const [text400] = useToken("colors", ["text.400"]);
	const { data: session } = useSession();
	const router = useRouter();
	const [editor] = useLexicalComposerContext();
	const selectedLanguage = useEditorStore((state) => state.selectedLanguage);

	const upsertDocument = trpc.document.upsertDocument.useMutation({
		onMutate() {
			setLoading(true);
		},
		onError() {
			setLoading(false);
		},
		onSuccess() {
			setLoading(false);
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
				language: selectedLanguage.id,
			});
		});
	}, [documentId, editor, selectedLanguage, upsertDocument]);

	const splitParagraph = () => {
		editor.dispatchCommand(SPLIT_PARAGRAPH, undefined);
	};

	const insertImageParagraph = () => {
		editor.dispatchCommand(INSERT_IMAGE_PARAGRAPH, undefined);
	};

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
				disabled={upsertDocument.isLoading}
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
			<Divider
				borderWidth="2px"
				borderRadius="3px"
				mb="0.5rem"
				gridColumn="span 2"
			/>
			<WordListPlugin />
			<Divider
				borderWidth="2px"
				borderRadius="3px"
				mb="0.5rem"
				gridColumn="span 2"
			/>
			<Button
				aria-label="Appereance"
				color="text.400"
				onClick={() => splitParagraph()}
			>
				SPLIT
			</Button>
			<Button
				aria-label="Appereance"
				color="text.400"
				onClick={() => insertImageParagraph()}
			>
				DEBUG
			</Button>
		</Box>,
		sidebarPortal
	);
};

export default SidebarPlugin;
