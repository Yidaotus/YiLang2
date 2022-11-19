import {
	$createRangeSelection,
	$getNodeByKey,
	$setSelection,
	LexicalEditor,
} from "lexical";

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
import { $createWordNode, $isWordNode } from "@editor/nodes/WordNode";
import { setFloatingElemPosition } from "@editor/utils/setFloatingPosition";
import { createPortal } from "react-dom";
import Button from "@ui/Button";

function CommentInputBox({
	editor,
	cancelAddComment,
	submitAddComment,
	anchorElem,
}: {
	cancelAddComment: () => void;
	editor: LexicalEditor;
	submitAddComment: (translation: string) => void;
	anchorElem: HTMLElement;
}) {
	const [content, setContent] = useState("");
	const canSubmit = content.length > 0;
	const boxRef = useRef<HTMLDivElement>(null);
	const selectionState = useMemo(
		() => ({
			container: document.createElement("div"),
			elements: [],
		}),
		[]
	);

	useEffect(() => {
		boxRef.current?.focus();
	}, [boxRef]);

	const updateLocation = useCallback(() => {
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
				const boxElem = boxRef.current;
				if (range !== null && boxElem !== null) {
					const { left, bottom, width } = range.getBoundingClientRect();
					const selectionRects = createRectsFromDOMRange(editor, range);
					let correctedLeft =
						selectionRects.length === 1 ? left + width / 2 - 125 : left - 125;
					if (correctedLeft < 10) {
						correctedLeft = 10;
					}

					const clientRect = range.getBoundingClientRect();
					const elemRect = boxElem.getBoundingClientRect();
					setFloatingElemPosition(
						range.getBoundingClientRect(),
						boxElem,
						anchorElem,
						-clientRect.height - elemRect.height - 15,
						elemRect.width / 2 - clientRect.width / 2
					);
					const selectionRectsLength = selectionRects.length;
					const { container } = selectionState;
					const elements: Array<HTMLSpanElement> = selectionState.elements;
					const elementsLength = elements.length;

					for (let i = 0; i < selectionRectsLength; i++) {
						const selectionRect = selectionRects[i];
						if (!selectionRect) continue;
						let elem: HTMLSpanElement | undefined = elements[i];
						if (elem === undefined) {
							elem = document.createElement("span");
							elements[i] = elem;
							container.appendChild(elem);
						}
						const color = "255, 212, 0";
						const style = `position:absolute;top:${selectionRect.top}px;left:${selectionRect.left}px;height:${selectionRect.height}px;width:${selectionRect.width}px;background-color:rgba(${color}, 0.3);pointer-events:none;z-index:5;`;
						elem.style.cssText = style;
					}
					for (let i = elementsLength - 1; i >= selectionRectsLength; i--) {
						const elem = elements[i];
						if (!elem) continue;
						container.removeChild(elem);
						elements.pop();
					}
				}
			}
		});
	}, [anchorElem, editor, selectionState]);

	useLayoutEffect(() => {
		updateLocation();
		const container = selectionState.container;
		const body = document.body;
		if (body !== null) {
			body.appendChild(container);
			return () => {
				body.removeChild(container);
			};
		}
	}, [selectionState.container, updateLocation]);

	useEffect(() => {
		window.addEventListener("resize", updateLocation);

		return () => {
			window.removeEventListener("resize", updateLocation);
		};
	}, [updateLocation]);

	const onEscape = (event: KeyboardEvent): boolean => {
		event.preventDefault();
		cancelAddComment();
		return true;
	};

	const submitComment = () => {
		if (canSubmit) {
			submitAddComment(content);
		}
	};

	return (
		<div
			className="absolute top-0 left-0 z-20 w-[250px] rounded-md border-2 border-gray-300 bg-white shadow-lg"
			ref={boxRef}
		>
			<div
				className="absolute top-[-1px] left-[105px] z-10 h-4 w-4 translate-x-1/2 -translate-y-1/2
						   rotate-45 transform border-l-2 border-t-2 border-gray-300 bg-white"
			/>
			<div className="h-10">
				<input
					onChange={(e) => setContent(e.target.value)}
					type="text"
					className="input relative h-full w-full resize-none rounded-b-none rounded-t-md bg-white p-2 outline-none focus:outline-none"
					autoFocus
				/>
			</div>
			<div className="grid h-9 w-full grid-cols-2 border-t border-gray-200">
				<button className="bg-base-500" onClick={cancelAddComment}>
					Cancel
				</button>
				<button
					className={`${
						canSubmit
							? "bg-primary-base font-bold text-gray-200 transition-colors duration-500 ease-in-out hover:bg-primary-dark active:bg-primary-darker active:duration-75"
							: "bg-primary-light font-bold text-base-500"
					}`}
					onClick={submitComment}
					disabled={!canSubmit}
				>
					Comment
				</button>
			</div>
		</div>
	);
}

const FloatingWordEditorPlugin = ({
	anchorElem,
}: {
	anchorElem: HTMLElement;
}) => {
	const [editor] = useLexicalComposerContext();
	const [showInput, setShowInput] = useState(false);
	const createWord = trpc.dictionary.createWord.useMutation();

	const insertWord = useCallback(
		async (translation: string) => {
			let newWordKey: string | null = null;
			let word: string | null = null;

			editor.update(() => {
				const selection = $getSelection();
				if (!selection) return;

				const text = selection.getTextContent();
				word = text;

				if ($isRangeSelection(selection)) {
					const newWordNode = $createWordNode(translation, text);
					selection.insertNodes([newWordNode]);
					setShowInput(false);
					newWordKey = newWordNode.getKey();
				}
			});

			if (!newWordKey || !word) return;

			const newWord = await createWord.mutateAsync({
				translation,
				word,
			});

			editor.update(() => {
				if (!newWord || !newWordKey) return;

				const newWordNode = $getNodeByKey(newWordKey);

				if (!$isWordNode(newWordNode)) return;

				newWordNode.setId(newWord.id);
			});
		},
		[createWord, editor]
	);

	useEffect(() => {
		return editor.registerCommand(
			SHOW_FLOATING_WORD_EDITOR_COMMAND,
			() => {
				const domSelection = window.getSelection();
				if (domSelection !== null) {
					domSelection.removeAllRanges();
				}
				setShowInput(true);
				return true;
			},
			COMMAND_PRIORITY_EDITOR
		);
	}, [editor]);

	const cancel = useCallback(() => {
		setShowInput(false);
	}, []);

	return showInput
		? createPortal(
				<CommentInputBox
					cancelAddComment={cancel}
					editor={editor}
					submitAddComment={insertWord}
					anchorElem={anchorElem}
				/>,
				anchorElem
		  )
		: null;
};

export default FloatingWordEditorPlugin;
