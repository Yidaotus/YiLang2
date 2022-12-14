import type { LexicalEditor, RangeSelection } from "lexical";

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
import { setFloatingElemPosition } from "@editor/utils/setFloatingPosition";
import { createPortal } from "react-dom";
import useOnClickOutside from "@ui/hooks/useOnClickOutside";
import { CreatableSelect } from "chakra-react-select";
import {
	Box,
	Input,
	Stack,
	Button,
	ButtonGroup,
	FormControl,
	FormErrorMessage,
	FormLabel,
} from "@chakra-ui/react";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import YiSimpleCreatableSelect from "@components/CreatableSelect/CreatableSelect";

type TagOption = EditorTag;

type WordFormType = {
	word: string;
	translations: Array<string>;
	spelling?: string;
	tags: Array<TagOption>;
};

type TagFormType = {
	name: string;
	color: string;
};

function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
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
						<FormLabel htmlFor="name">Name</FormLabel>
						<Input
							id="name"
							placeholder="Name"
							{...register("name", {
								required: "Please enter a name",
								minLength: { value: 2, message: "Minimum length should be 4" },
							})}
						/>
						<FormErrorMessage>
							{errors.name && errors.name.message}
						</FormErrorMessage>
					</FormControl>
					<FormControl isInvalid={!!errors.color}>
						<FormLabel htmlFor="spelling">Color</FormLabel>
						<Input
							id="color"
							placeholder="Color"
							{...register("color", {
								required: "Please enter a color",
								minLength: { value: 7, message: "Minimum length should be 7" },
							})}
						/>
						<FormErrorMessage>
							{errors.color && errors.color.message}
						</FormErrorMessage>
					</FormControl>
					<ButtonGroup
						isAttached
						sx={{
							pt: 2,
							w: "100%",
							"&>button": {
								flexGrow: 1,
							},
						}}
					>
						<Button variant="outline" onClick={cancel}>
							Cancel
						</Button>
						<Button variant="solid" type="submit">
							Submit
						</Button>
					</ButtonGroup>
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
						<FormLabel htmlFor="translation">Translation</FormLabel>
						<Controller
							control={control}
							name="translations"
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
						<FormLabel htmlFor="spelling">Spelling</FormLabel>
						<Input
							id="spelling"
							placeholder="Spelling"
							{...register("spelling", {
								required: "Please enter a spelling",
								minLength: { value: 2, message: "Minimum length should be 4" },
							})}
						/>
						<FormErrorMessage>
							{errors.spelling && errors.spelling.message}
						</FormErrorMessage>
					</FormControl>
					<Controller
						control={control}
						name="tags"
						render={({ field: { onChange, value, ref } }) => (
							<CreatableSelect
								ref={ref}
								size="sm"
								value={value}
								onChange={(val) => onChange(val)}
								noOptionsMessage={(val) => <span>{`Create ${val}`}</span>}
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
												display: "flex",
												alignItems: "center",
												cursor: "pointer",
												w: "100%",
												"&:hover": {
													bg: "#f4f4f4",
												},
											}}
											{...innerProps}
										>
											<Box
												sx={{
													w: "2px",
													h: "15px",
													ml: 1,
													mr: 2,
													borderRadius: "3px",
													border: `2px solid ${data.color}`,
												}}
											/>
											{children}
										</Box>
									),
								}}
							/>
						)}
					/>
					<ButtonGroup
						isAttached
						sx={{
							pt: 2,
							w: "100%",
							"&>button": {
								flexGrow: 1,
							},
						}}
					>
						<Button variant="outline" onClick={cancel}>
							Cancel
						</Button>
						<Button variant="solid" type="submit">
							Submit
						</Button>
					</ButtonGroup>
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
};

// eslint-disable-next-line react/display-name
const CommentInputBox = React.forwardRef<
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
		}: CommentInputBoxProps,
		ref
	) => {
		const utils = trpc.useContext();
		const createWord = trpc.dictionary.createWord.useMutation({
			onSuccess() {
				utils.dictionary.getAllTags.invalidate();
			},
		});
		const boxRef = useRef<HTMLDivElement | null>(null);

		const selectionState = useMemo(
			() => ({
				container: document.createElement("div"),
				elements: [],
			}),
			[]
		);

		const updateLocation = useCallback(() => {
			const boxElem = boxRef.current;
			if (!boxElem) return;

			if (!show) {
				setFloatingElemPosition({
					targetRect: null,
					floatingElem: boxElem,
					anchorElem,
					verticalOffset: 10,
				});

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

						setFloatingElemPosition({
							targetRect: range.getBoundingClientRect(),
							floatingElem: boxElem,
							anchorElem,
							verticalOffset: 10,
						});
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
					});
					submitWord(newWord);
					console.debug(newWord);
				} else {
					cancel();
				}
			},
			[cancel, createWord, submitWord]
		);

		const dbTags = trpc.dictionary.getAllTags.useQuery(undefined, {
			enabled: show,
		});

		return (
			<Box
				sx={{
					pos: "absolute",
					top: 0,
					left: 0,
					zIndex: 20,
					p: 4,
					w: "300px",
					borderRadius: "3px",
					border: "1px solid #f4f4f4",
					bg: "white",
					boxShadow:
						"0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
					display: "grid",
					gridTemplateRows: "1fr",
					gridTemplateColumns: "1fr",
				}}
				ref={(r) => {
					boxRef.current = r;

					if (ref) {
						if (typeof ref === "function") {
							ref(r);
						} else {
							ref.current = r;
						}
					}
				}}
			>
				{show && dbTags.isFetched && (
					<>
						<Box
							sx={{
								gridColumnStart: 1,
								gridRowStart: 1,
								display: move ? "none" : "block",
							}}
						>
							<WordForm
								showTagEditor={getNewTag}
								resolveWord={resolveWord}
								word={word}
								dbTags={dbTags.data || []}
							/>
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
					</>
				)}
			</Box>
		);
	}
);

const FloatingWordEditorPlugin = ({
	anchorElem,
}: {
	anchorElem: HTMLElement;
}) => {
	const [editor] = useLexicalComposerContext();
	const [showInput, setShowInput] = useState(false);
	const [word, setWord] = useState("");
	const inputRef = useRef(null);
	const [selection, setSelection] = useState<RangeSelection | null>(null);

	useOnClickOutside(inputRef, () => {
		if (showInput && inputRef.current) {
			console.debug("CLICK OUTSIDE");
			setShowInput(false);
		}
	});

	const insertWord = useCallback(
		(newWord: EditorWord) => {
			editor.update(() => {
				console.debug({ selection });
				if (!selection) return;

				if ($isRangeSelection(selection)) {
					const newWordNode = $createWordNode(
						newWord.translations,
						newWord.word,
						newWord.id
					);
					selection.insertNodes([newWordNode]);
					setShowInput(false);
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
				const domSelection = window.getSelection();
				if (domSelection !== null) {
					domSelection.removeAllRanges();
				}

				const word = selection.getTextContent();
				setWord(word);
				setShowInput(true);
				return true;
			},
			COMMAND_PRIORITY_EDITOR
		);
	}, [editor]);

	const cancel = useCallback(() => {
		setShowInput(false);
	}, []);

	return createPortal(
		<CommentInputBox
			word={word}
			ref={inputRef}
			show={showInput}
			cancel={cancel}
			editor={editor}
			submitWord={insertWord}
			anchorElem={anchorElem}
		/>,
		anchorElem
	);
};

export default FloatingWordEditorPlugin;
