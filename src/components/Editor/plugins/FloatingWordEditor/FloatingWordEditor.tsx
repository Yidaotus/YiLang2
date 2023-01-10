import type { EditorTag, EditorWord } from "@editor/nodes/WordNode";
import type { ReferenceType } from "@floating-ui/react";
import type { LexicalEditor, RangeSelection } from "lexical";
import type { WordFormType } from "./WordForm";

import { Box, Spinner } from "@chakra-ui/react";
import FloatingContainer from "@components/Editor/ui/FloatingContainer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { createDOMRange, createRectsFromDOMRange } from "@lexical/selection";
import useEditorStore from "@store/store";
import useOnClickOutside from "@ui/hooks/useOnClickOutside";
import { trpc } from "@utils/trpc";
import {
	$getSelection,
	$isRangeSelection,
	$setSelection,
	COMMAND_PRIORITY_EDITOR,
	createCommand,
} from "lexical";
import React, {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { INSERT_WORD } from "../WordPlugin/WordPlugin";
import TagForm from "./TagForm";
import WordForm from "./WordForm";

type TagOption = EditorTag;

export const SHOW_FLOATING_WORD_EDITOR_COMMAND = createCommand<void>(
	"SHOW_FLOATING_WORD_EDITOR_COMMAN"
);

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
				editor.dispatchCommand(INSERT_WORD, newWord);
				setPopupReference(null);
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
