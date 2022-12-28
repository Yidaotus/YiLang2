import type { LexicalEditor, RangeSelection } from "lexical";
import { $insertNodes, $setSelection } from "lexical";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_EDITOR,
} from "lexical";
import {
	useState,
	useRef,
	useMemo,
	useCallback,
	useLayoutEffect,
	useEffect,
} from "react";
import { createDOMRange, createRectsFromDOMRange } from "@lexical/selection";
import { SHOW_FLOATING_WORD_EDITOR_COMMAND } from "@editor/Editor";
import { trpc } from "@utils/trpc";
import type { EditorTag, EditorWord } from "@editor/nodes/WordNode";
import { $createWordNode } from "@editor/nodes/WordNode";
import { createPortal } from "react-dom";
import useOnClickOutside from "@ui/hooks/useOnClickOutside";
import { CreatableSelect } from "chakra-react-select";
import {
	Box,
	Input,
	Stack,
	Button,
	FormControl,
	FormErrorMessage,
	FormLabel,
	Textarea,
	IconButton,
	Spinner,
} from "@chakra-ui/react";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import YiSimpleCreatableSelect from "@components/CreatableSelect/CreatableSelect";
import { CirclePicker } from "react-color";

import { IoSave } from "react-icons/io5";
import { RxExit, RxTrash } from "react-icons/rx";
import FloatingContainer from "@components/Editor/ui/FloatingContainer";
import type { ReferenceType } from "@floating-ui/react";
import useEditorStore from "@store/store";

type TagOption = EditorTag;

type WordFormType = {
	word: string;
	translations: Array<string>;
	spelling?: string;
	comment?: string;
	tags: Array<TagOption>;
};

type TagFormType = {
	name: string;
	color: string;
};

export function getDOMRangeRect(
	nativeSelection: Selection,
	rootElement: HTMLElement
): DOMRect {
	const domRange = nativeSelection.getRangeAt(0);

	let rect;

	if (nativeSelection.anchorNode === rootElement) {
		let inner = rootElement;
		while (inner.firstElementChild != null) {
			inner = inner.firstElementChild as HTMLElement;
		}
		rect = inner.getBoundingClientRect();
	} else {
		rect = domRange.getBoundingClientRect();
	}

	return rect;
}

const TagForm = ({
	resolveTag,
	name,
}: {
	resolveTag: (newTag: TagOption | null) => void;
	name: string;
}) => {
	const {
		handleSubmit,
		register,
		reset,
		setValue,
		control,
		formState: { errors },
	} = useForm<TagFormType>({
		defaultValues: {
			name,
			color: "",
		},
	});

	useEffect(() => {
		setValue("name", name);
	}, [name, setValue]);

	const onSubmit = handleSubmit((data) => {
		reset();
		resolveTag(data);
	});

	const cancel = useCallback(() => {
		reset();
		resolveTag(null);
	}, [reset, resolveTag]);

	return (
		<div>
			<form action="" className="flex flex-col gap-2" onSubmit={onSubmit}>
				<Stack>
					<FormControl isInvalid={!!errors.name}>
						<FormLabel
							htmlFor="spelling"
							color="text.400"
							fontSize="0.9em"
							mb="0px"
							display="none"
						>
							Name
						</FormLabel>
						<Input
							sx={{
								"&::placeholder": {
									color: "text.200",
								},
							}}
							id="name"
							bg="#FAFAF9"
							borderWidth={2}
							placeholder="Name"
							{...register("name", {
								required: "Please enter a name",
								minLength: {
									value: 2,
									message: "Minimum length should be 4",
								},
							})}
						/>
						<FormErrorMessage>
							{errors.name && errors.name.message}
						</FormErrorMessage>
					</FormControl>
					<FormControl
						isInvalid={!!errors.color}
						p={2}
						py={4}
						display="flex"
						justifyContent="center"
						borderRadius="5px"
						borderColor="text.100"
						borderWidth="2px"
						bg="#FAFAF9"
					>
						<FormLabel
							htmlFor="color"
							color="text.400"
							fontSize="0.9em"
							mb="0px"
							display="none"
						>
							Color
						</FormLabel>
						<Controller
							control={control}
							name="color"
							rules={{
								required: "Please enter at least one translation",
								min: "Please enter at least one translation",
							}}
							render={({ field: { onChange, value, ref } }) => (
								<CirclePicker
									color={value}
									onChange={(e) => onChange(e.hex)}
									ref={ref}
									circleSize={22}
									width="100%"
								/>
							)}
						/>
						<FormErrorMessage>
							{errors.color && errors.color.message}
						</FormErrorMessage>
					</FormControl>
					<Box
						sx={{
							pt: 2,
							w: "100%",
						}}
						display="flex"
						justifyContent="space-between"
					>
						<IconButton
							variant="ghost"
							onClick={cancel}
							aria-label="cancel"
							icon={<RxExit />}
						/>
						<Button
							bg="brand.500"
							color="#FFFFFF"
							variant="solid"
							type="submit"
							rightIcon={<IoSave />}
							sx={{
								"&:hover": {
									bg: "brand.700",
								},
							}}
						>
							Create
						</Button>
					</Box>
				</Stack>
			</form>
		</div>
	);
};

const WordForm = ({
	word,
	showTagEditor,
	resolveWord,
	dbTags,
}: {
	word: string;
	showTagEditor: (newTagName: string) => Promise<TagOption | null>;
	resolveWord: (newWord: WordFormType | null) => void;
	dbTags: Array<EditorTag>;
}) => {
	const {
		handleSubmit,
		control,
		register,
		reset,
		setValue,
		formState: { errors },
	} = useForm<WordFormType>({
		defaultValues: {
			word,
			translations: [],
			spelling: "",
			tags: [],
			comment: "",
		},
	});

	useEffect(() => {
		setValue("word", word);
	}, [setValue, word]);

	const [tagOptions, setTagOptions] = useState<Array<EditorTag>>(dbTags);

	const onSubmit = handleSubmit((data) => {
		reset();
		resolveWord(data);
	});

	const cancel = useCallback(() => {
		reset();
		resolveWord(null);
	}, [reset, resolveWord]);

	const createNewTag = useCallback(
		async (newTagName: string) => {
			const getNewTag = await showTagEditor(newTagName);
			return getNewTag;
		},
		[showTagEditor]
	);

	return (
		<div>
			<form action="" className="flex flex-col gap-2" onSubmit={onSubmit}>
				<Stack>
					<FormControl isInvalid={!!errors.translations}>
						<FormLabel
							display="none"
							htmlFor="translations"
							color="text.400"
							fontSize="0.9em"
							mb="0px"
						>
							Translation(s)
						</FormLabel>
						<Controller
							control={control}
							name="translations"
							rules={{
								required: "Please enter at least one translation",
								min: "Please enter at least one translation",
							}}
							render={({ field: { onChange, value, ref } }) => (
								<YiSimpleCreatableSelect
									ref={ref}
									value={value}
									onChange={(val) => onChange(val)}
									placeholder="Translation(s)"
								/>
							)}
						/>
						<FormErrorMessage>
							{errors.translations && errors.translations.message}
						</FormErrorMessage>
					</FormControl>
					<FormControl isInvalid={!!errors.spelling}>
						<FormLabel
							display="none"
							htmlFor="spelling"
							color="text.400"
							fontSize="0.9em"
							mb="0px"
						>
							Spelling
						</FormLabel>

						<Input
							sx={{
								"&::placeholder": {
									color: "text.200",
								},
								bg: "#fafaf9",
							}}
							id="spelling"
							size="md"
							placeholder="Spelling"
							{...register("spelling")}
						/>
						<FormErrorMessage>
							{errors.spelling && errors.spelling.message}
						</FormErrorMessage>
					</FormControl>
					<FormControl isInvalid={!!errors.tags}>
						<FormLabel
							display="none"
							htmlFor="tags"
							color="text.400"
							fontSize="0.9em"
							mb="0px"
						>
							Tags
						</FormLabel>
						<Controller
							control={control}
							name="tags"
							render={({ field: { onChange, value, ref } }) => (
								<CreatableSelect
									ref={ref}
									size="md"
									value={value}
									onChange={(val) => onChange(val)}
									noOptionsMessage={(val) => <span>{`Create ${val}`}</span>}
									chakraStyles={{
										container: (prev) => ({
											...prev,
											borderRadius: "5px",
											bg: "#fafaf9",
										}),
										multiValue: (prev, state) => ({
											...prev,
											justifyContent: "center",
											alignItems: "center",
											borderColor: "text.100",
											bg: "#F5F5F5",
											borderWidth: "1px",
											"&::before": {
												content: '""',
												bg: state.data.color,
												h: "10px",
												w: "5px",
												pr: 2,
												mr: 2,
												borderRadius: "1em",
												border: `1px solid ${state.data.color}`,
											},
										}),
										indicatorSeparator: (prev) => ({
											...prev,
											borderLeft: "1px solid text.100",
											height: "60%",
										}),
										dropdownIndicator: (prev) => ({
											...prev,
											w: "10px",
											bg: "#FCFCFB",
										}),
										placeholder: (prev) => ({
											...prev,
											color: "text.200",
										}),
									}}
									placeholder="Tags"
									isMulti
									options={tagOptions}
									getOptionValue={(o) => o.name}
									getOptionLabel={(o) => o.name}
									getNewOptionData={(input, label) => ({
										name: `Create ${input} tag...`,
										color: "",
									})}
									onCreateOption={async (newOpt) => {
										const newTag = await createNewTag(newOpt);
										if (newTag) {
											setTagOptions([...value, ...tagOptions, newTag]);
											onChange([...value, newTag]);
										}
									}}
									components={{
										Option: ({ children, data, innerProps }) => (
											<Box
												as="div"
												sx={{
													color: "text.400",
													display: "flex",
													alignItems: "center",
													cursor: "pointer",
													py: 1,
													fontSize: "16px",
													w: "100%",
													"&:hover": {
														bg: "#f4f4f4",
													},
												}}
												{...innerProps}
											>
												<Box
													sx={{
														w: "12px",
														h: "12px",
														ml: 1,
														mr: 2,
														borderRadius: "4px",
														border: `2px solid ${data.color}`,
														bg: data.color,
													}}
												/>
												{children}
											</Box>
										),
									}}
								/>
							)}
						/>
						<FormErrorMessage>
							{errors.spelling && errors.spelling.message}
						</FormErrorMessage>
					</FormControl>
					<FormControl isInvalid={!!errors.comment}>
						<FormLabel
							display="none"
							htmlFor="comment"
							color="text.400"
							fontSize="0.9em"
							mb="0px"
						>
							Comment
						</FormLabel>
						<Textarea
							sx={{
								"&::placeholder": {
									color: "text.200",
								},
								bg: "#fafaf9",
							}}
							id="comment"
							size="md"
							placeholder="Comment"
							{...register("comment")}
						/>
						<FormErrorMessage>
							{errors.comment && errors.comment.message}
						</FormErrorMessage>
					</FormControl>
					<Box
						sx={{
							pt: 2,
							w: "100%",
						}}
						display="flex"
						justifyContent="space-between"
					>
						<IconButton
							aria-label="cancel"
							icon={<RxTrash />}
							onClick={cancel}
						/>
						<Button
							bg="brand.500"
							color="#FFFFFF"
							variant="solid"
							type="submit"
							rightIcon={<IoSave />}
							sx={{
								"&:hover": {
									bg: "brand.700",
								},
							}}
						>
							Submit
						</Button>
					</Box>
				</Stack>
			</form>
		</div>
	);
};

type CommentInputBoxProps = {
	word: string;
	cancel: () => void;
	editor: LexicalEditor;
	submitWord: (word: EditorWord) => void;
	anchorElem: HTMLElement;
	show: boolean;
	documentId: string;
};

// eslint-disable-next-line react/display-name
const WordEditorPopup = React.forwardRef<
	HTMLDivElement | null,
	CommentInputBoxProps
>(
	(
		{
			editor,
			cancel,
			submitWord,
			anchorElem,
			word,
			show,
			documentId,
		}: CommentInputBoxProps,
		ref
	) => {
		const utils = trpc.useContext();
		const createWord = trpc.dictionary.createWord.useMutation({
			onSuccess() {
				utils.dictionary.getAllTags.invalidate();
			},
		});
		const selectedLanguage = useEditorStore((store) => store.selectedLanguage);

		const selectionState = useMemo(
			() => ({
				container: document.createElement("div"),
				elements: [],
			}),
			[]
		);

		const updateLocation = useCallback(() => {
			if (!show) {
				const { container } = selectionState;
				const elements: Array<HTMLSpanElement> = selectionState.elements;
				const elementsLength = elements.length;
				for (let i = elementsLength - 1; i >= 0; i--) {
					const elem = elements[i];
					if (!elem) continue;
					container.removeChild(elem);
					elements.pop();
				}
				return;
			}

			editor.getEditorState().read(() => {
				const selection = $getSelection();

				if ($isRangeSelection(selection)) {
					const anchor = selection.anchor;
					const focus = selection.focus;
					const range = createDOMRange(
						editor,
						anchor.getNode(),
						anchor.offset,
						focus.getNode(),
						focus.offset
					);
					if (range !== null) {
						const selectionRects = createRectsFromDOMRange(editor, range);

						const selectionRectsLength = selectionRects.length;
						const { container } = selectionState;
						const elements: Array<HTMLSpanElement> = selectionState.elements;

						for (let i = 0; i < selectionRectsLength; i++) {
							const selectionRect = selectionRects[i];
							if (!selectionRect) continue;
							let elem: HTMLSpanElement | undefined = elements[i];
							if (elem === undefined) {
								elem = document.createElement("span");
								elements[i] = elem;
								container.appendChild(elem);
							}
							//@TODO: Factor out! This is ugly as f
							const color = "255, 212, 0";
							const style = `position:absolute;top:${
								selectionRect.top - anchorElem.getBoundingClientRect().top
							}px;left:${
								selectionRect.left - anchorElem.getBoundingClientRect().left
							}px;height:${selectionRect.height}px;width:${
								selectionRect.width
							}px;background-color:rgba(${color}, 0.3);pointer-events:none;z-index:5;border-radius:3px`;
							elem.style.cssText = style;
						}
					}
				}
			});
		}, [anchorElem, editor, selectionState, show]);

		useLayoutEffect(() => {
			updateLocation();
			const container = selectionState.container;
			const targetElem = anchorElem;
			if (targetElem !== null) {
				targetElem.appendChild(container);
				return () => {
					targetElem.removeChild(container);
				};
			}
		}, [anchorElem, selectionState.container, updateLocation]);

		useEffect(() => {
			window.addEventListener("resize", updateLocation);

			return () => {
				window.removeEventListener("resize", updateLocation);
			};
		}, [anchorElem, updateLocation]);

		const onEscape = (event: KeyboardEvent): boolean => {
			event.preventDefault();
			cancel();
			return true;
		};

		const [move, setMove] = useState(false);
		const [tagName, setTagName] = useState("");

		const [waitingForTagPromise, setWaitingForTagPromise] = useState<{
			resolve: (newTag: TagOption | null) => void;
			reject: () => void;
		} | null>(null);

		const resolveNewTag = useCallback(
			(newTag: TagOption | null) => {
				if (waitingForTagPromise) {
					waitingForTagPromise.resolve(newTag || null);
					setMove(false);
				}
			},
			[waitingForTagPromise]
		);

		const getNewTag = useCallback(async (newTagName: string) => {
			setMove(true);
			const wordFormWaitPromise = new Promise<TagOption | null>(
				(resolve, reject) => {
					setTagName(newTagName);
					setWaitingForTagPromise({ resolve, reject });
				}
			);
			return wordFormWaitPromise;
		}, []);

		const resolveWord = useCallback(
			async (word: WordFormType | null) => {
				if (word) {
					const newWord = await createWord.mutateAsync({
						word: word.word,
						translations: word.translations,
						spelling: word.spelling,
						tags: word.tags.map((tag) => (tag.id ? tag.id : tag)),
						comment: word.comment,
						language: selectedLanguage.id,
						documentId,
					});
					submitWord(newWord);
				} else {
					cancel();
				}
			},
			[cancel, createWord, documentId, selectedLanguage, submitWord]
		);

		const dbTags = trpc.dictionary.getAllTags.useQuery({
			language: selectedLanguage.id,
		});

		return (
			<Box ref={ref} p={2} w="325px">
				{createWord.isLoading && (
					<Box
						w="100%"
						h="100%"
						pos="absolute"
						left="0"
						top="0"
						bg="rgba(0,0,0,0.2)"
						display="flex"
						alignItems="center"
						justifyContent="center"
						zIndex={50}
						borderRadius="5px"
					>
						<Spinner color="brand.500" size="lg" />
					</Box>
				)}
				<Box
					sx={{
						gridColumnStart: 1,
						gridRowStart: 1,
						display: move ? "none" : "block",
					}}
				>
					{dbTags.isLoading && <Box>Loading</Box>}
					{dbTags.data && (
						<WordForm
							showTagEditor={getNewTag}
							resolveWord={resolveWord}
							word={word}
							dbTags={dbTags.data}
						/>
					)}
				</Box>
				<Box
					sx={{
						gridColumnStart: 1,
						gridRowStart: 1,
						display: move ? "block" : "none",
					}}
				>
					<TagForm resolveTag={resolveNewTag} name={tagName} />
				</Box>
			</Box>
		);
	}
);

const WordEditorPopupMemo = React.memo(WordEditorPopup);

const FloatingWordEditorPlugin = ({
	anchorElem,
	documentId,
}: {
	anchorElem: HTMLElement;
	documentId: string;
}) => {
	const [editor] = useLexicalComposerContext();
	const [showInput, setShowInput] = useState(false);
	const [word, setWord] = useState("");
	const inputRef = useRef(null);
	const [selection, setSelection] = useState<RangeSelection | null>(null);
	const [popupReference, setPopupReference] = useState<ReferenceType | null>(
		null
	);

	useOnClickOutside(inputRef, () => {
		if (showInput && inputRef.current) {
			setPopupReference(null);
		}
	});

	const insertWord = useCallback(
		(newWord: EditorWord) => {
			editor.update(() => {
				if (!selection) return;
				// other methods will modify the editorstate so if we don't first 'import' our saved selection in the editor state
				// things will fall apart if other methods try to modify the 'current selection'
				$setSelection(selection);

				if ($isRangeSelection(selection)) {
					const newWordNode = $createWordNode(
						newWord.translations,
						newWord.word,
						newWord.id
					);
					$insertNodes([newWordNode]);
					setPopupReference(null);
				}
			});
		},
		[editor, selection]
	);

	useEffect(() => {
		return editor.registerCommand(
			SHOW_FLOATING_WORD_EDITOR_COMMAND,
			() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) return true;

				setSelection(selection);

				const nativeSelection = window.getSelection();
				const rootElement = editor.getRootElement();
				if (
					selection !== null &&
					nativeSelection !== null &&
					!nativeSelection.isCollapsed &&
					rootElement !== null &&
					rootElement.contains(nativeSelection.anchorNode)
				) {
					const rangeRect = getDOMRangeRect(nativeSelection, rootElement);
					setPopupReference({ getBoundingClientRect: () => rangeRect });
				} else {
					setPopupReference(null);
				}

				const domSelection = window.getSelection();
				if (domSelection !== null) {
					domSelection.removeAllRanges();
				}

				const word = selection.getTextContent();
				setWord(word);
				return true;
			},
			COMMAND_PRIORITY_EDITOR
		);
	}, [editor]);

	const cancel = useCallback(() => {
		setPopupReference(null);
	}, []);

	return createPortal(
		<FloatingContainer popupReference={popupReference} popupPlacement="bottom">
			<WordEditorPopupMemo
				word={word}
				ref={inputRef}
				show={popupReference !== null}
				cancel={cancel}
				editor={editor}
				submitWord={insertWord}
				anchorElem={anchorElem}
				documentId={documentId}
			/>
		</FloatingContainer>,
		anchorElem
	);
};

export default FloatingWordEditorPlugin;
