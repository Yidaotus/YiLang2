import type { Middleware, ReferenceType } from "@floating-ui/react";

import {
	Box,
	Button,
	ButtonGroup,
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
import { WordNode } from "@components/Editor/nodes/WordNode";
import FloatingContainer from "@components/Editor/ui/FloatingContainer";
import { blockTypes } from "@components/Editor/utils/blockTypeFormatters";
import useLoadingToast from "@components/LoadingToast/LoadingToast";
import Word from "@components/Word";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isHeadingNode } from "@lexical/rich-text";
import useEditorStore from "@store/store";
import useOnClickOutside from "@ui/hooks/useOnClickOutside";
import { trpc } from "@utils/trpc";
import {
	$createNodeSelection,
	$getNodeByKey,
	$getRoot,
	$setSelection,
	LineBreakNode,
} from "lexical";
import router from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
	IoCheckmarkDone,
	IoChevronDown,
	IoGridOutline,
	IoLanguageOutline,
	IoSaveOutline,
	IoSettings,
} from "react-icons/io5";
import {
	RiFontSize2,
	RiLineHeight,
	RiParagraph,
	RiSwapBoxLine,
} from "react-icons/ri";
import { RxColumns, RxRows } from "react-icons/rx";
import shallow from "zustand/shallow";
import {
	SET_LAYOUT_MODE_FULL,
	SET_LAYOUT_MODE_SPLIT,
	SWAP_SPLIT_COLUMNS,
} from "../SplitLayoutPlugin/SplitLayoutPlugin";

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
	const { hideAutoFillWords, setHideAutoFillWords } = useEditorStore(
		(state) => ({
			hideAutoFillWords: state.editorHideAutoFillWords,
			setHideAutoFillWords: state.setEditorHideAutoFillWords,
		}),
		shallow
	);
	//@TODO Idea pull out wordStore into plugin so other plugins can hook into it by bear
	const [wordStore, setWordStore] = useState<
		Record<string, { wordId: string; isAutoFill: boolean }>
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
						if (!wordId) return;

						const isAutoFill = wordNode.getIsAutoFill();

						setWordStore((currentStore) => ({
							...currentStore,
							[nodeKey]: {
								wordId,
								isAutoFill,
							},
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
				([_, node]) => targetWordId === node.wordId
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
						maxH="70vh"
						overflow="auto"
						marginBottom="60px"
					>
						{Object.entries(wordStore)
							.filter(([_, word]) => !(hideAutoFillWords && word.isAutoFill))
							.map(([nodeKey, node]) => (
								<Word
									border
									key={nodeKey}
									wordId={node.wordId}
									wordKey={nodeKey}
									clickHandler={() => highlightWord(nodeKey)}
								/>
							))}
					</Box>
					<Box
						pos="absolute"
						bottom="0"
						w="100%"
						bg="white"
						px={4}
						borderTopWidth="1px"
						borderTopColor="text.100"
						borderRadius="0px 0px 3px 3px"
					>
						<FormControl
							display="flex"
							alignItems="center"
							my={4}
							justifyContent="space-between"
						>
							<FormLabel
								htmlFor="hide-auto-fill-words"
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
									Hide Autofill Words
								</Text>
							</FormLabel>
							<Switch
								colorScheme="brand"
								id="hide-auto-fill-words"
								isChecked={hideAutoFillWords}
								onChange={(e) => setHideAutoFillWords(e.target.checked)}
							/>
						</FormControl>
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
			<LayoutMenu />
		</Box>,
		sidebarPortal
	);
};

export default SidebarPlugin;
