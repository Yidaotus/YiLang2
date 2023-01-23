import type { EditorTag, EditorWord } from "@editor/nodes/WordNode";
import type { Middleware, ReferenceType } from "@floating-ui/react";
import { mergeRegister } from "@lexical/utils";
import type { LexicalEditor, RangeSelection } from "lexical";
import { $createNodeSelection, $createTextNode, $getNodeByKey } from "lexical";
import type { WordFormType } from "./WordForm";

import { Box, Spinner } from "@chakra-ui/react";
import {
	$createWordAnchorNode,
	WordAnchor,
} from "@components/Editor/nodes/WordAnchor/WordEditorAnchor";
import FloatingContainer from "@components/Editor/ui/FloatingContainer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import useEditorSettingsStore from "@store/store";
import useOnClickOutside from "@ui/hooks/useOnClickOutside";
import { trpc } from "@utils/trpc";
import {
	$getSelection,
	$isRangeSelection,
	$setSelection,
	COMMAND_PRIORITY_EDITOR,
	createCommand,
} from "lexical";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
		const createWord = trpc.dictionary.word.create.useMutation({
			onSuccess() {
				utils.dictionary.tag.getAll.invalidate();
			},
		});
		const selectedLanguage = useEditorSettingsStore(
			(store) => store.selectedLanguage
		);

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
			async (formWord: WordFormType | null) => {
				if (formWord) {
					if (formWord.root) {
						let rootId;
						if (typeof formWord.root === "string") {
							const newRoot = await createWord.mutateAsync({
								word: formWord.root,
								translations: formWord.translations,
								spelling: formWord.spelling,
								tags: formWord.tags.map((tag) => (tag.id ? tag.id : tag)),
								comment: formWord.notes,
								language: selectedLanguage.id,
								documentId,
							});
							rootId = newRoot.id;
						} else {
							rootId = formWord.root.id;
						}
						const newWord = await createWord.mutateAsync({
							word: formWord.word,
							translations: [],
							spelling: formWord.variationSpelling,
							tags: formWord.variationTags
								? formWord.variationTags.map((tag) => (tag.id ? tag.id : tag))
								: [],
							comment: "",
							language: selectedLanguage.id,
							root: rootId,
							documentId,
						});
						const { id, ...rest } = newWord;
						submitWord({ databaseId: id, ...rest });
					} else {
						const newWord = await createWord.mutateAsync({
							word: formWord.word,
							translations: formWord.translations,
							spelling: formWord.spelling,
							tags: formWord.tags.map((tag) => (tag.id ? tag.id : tag)),
							comment: formWord.notes,
							language: selectedLanguage.id,
							documentId,
						});
						const { id, ...rest } = newWord;
						submitWord({ databaseId: id, ...rest });
					}
				} else {
					cancel();
				}
			},
			[cancel, createWord, documentId, selectedLanguage, submitWord]
		);

		const dbTags = trpc.dictionary.tag.getAll.useQuery({
			language: selectedLanguage.id,
		});

		return (
			<Box ref={ref} w="450px">
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
	const [anchorNodeKey, setAnchorNodeKey] = useState<string | null>(null);
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
				if (!anchorNodeKey) {
					if (!selection) return;
					$setSelection(selection);
				}
				editor.dispatchCommand(INSERT_WORD, {
					...newWord,
					targetNode: anchorNodeKey || undefined,
				});
			});
			setPopupReference(null);
		},
		[anchorNodeKey, editor, selection]
	);

	const cancel = useCallback(() => {
		if (anchorNodeKey) {
			editor.update(() => {
				const target = $getNodeByKey(anchorNodeKey);
				if (!target) return;

				target.replace($createTextNode(word));
			});
		}
		setAnchorNodeKey(null);
	}, [anchorNodeKey, editor, word]);

	useEffect(() => {
		return mergeRegister(
			editor.registerCommand(
				SHOW_FLOATING_WORD_EDITOR_COMMAND,
				() => {
					// Are we displaying anywhere else already?
					if (anchorNodeKey) {
						const target = $getNodeByKey(anchorNodeKey);
						if (target) {
							target.replace($createTextNode(word));
						}
					}

					const selection = $getSelection();
					if (!$isRangeSelection(selection)) return true;

					setSelection(selection);
					const selectionWord = selection.getTextContent();
					setWord(selectionWord);
					const anchorNode = $createWordAnchorNode(selectionWord);
					setAnchorNodeKey(anchorNode.getKey());
					// $insertNodes([anchorNode]);

					const extractedNodes = selection.extract();
					for (const [index, node] of extractedNodes.entries()) {
						if (index === 0) {
							node.replace(anchorNode);
						} else {
							node.remove();
						}
					}

					const nodeSelection = $createNodeSelection();
					nodeSelection.add(anchorNode.getKey());
					$setSelection(nodeSelection);

					return true;
				},
				COMMAND_PRIORITY_EDITOR
			),
			editor.registerMutationListener(WordAnchor, (updates) => {
				for (const [nodeKey, update] of updates) {
					if (update === "created" || update === "updated") {
						const element = editor.getElementByKey(nodeKey);
						if (!element) return;

						setPopupReference(element);
						break;
					}
					if (update === "destroyed") {
						setPopupReference(null);
					}
				}
			})
		);
	}, [anchorNodeKey, cancel, editor, word]);

	return createPortal(
		<FloatingContainer
			popupReference={popupReference}
			popupPlacement="bottom-start"
			popupOffset={0}
			middlewares={[shiftOnRightOverflow]}
		>
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

const shiftOnRightOverflow: Middleware = {
	name: "placeLeftOrRight",
	fn({ elements, placement, x, y, initialPlacement }) {
		const floater = elements.floating;
		const container = elements.floating.parentElement;
		if (!container) return {};

		const floaterLeft = x;
		const containerTargetLimit = container.clientWidth / 2;

		console.debug({ floaterLeft, containerTargetLimit, floater, container });

		if (
			floaterLeft > containerTargetLimit &&
			initialPlacement === "bottom-start"
		) {
			return {
				reset: {
					placement: "bottom",
				},
			};
		}
		if (
			floaterLeft <= containerTargetLimit &&
			initialPlacement === "bottom-end"
		) {
			return {
				reset: {
					placement: "bottom-start",
				},
			};
		}
		return {};
	},
};

export default FloatingWordEditorPlugin;
