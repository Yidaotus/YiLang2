import type { LexicalEditor } from "lexical";

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
import { INSERT_WORD_COMMAND } from "@editor/Editor";

function CommentInputBox({
	editor,
	cancelAddComment,
	submitAddComment,
}: {
	cancelAddComment: () => void;
	editor: LexicalEditor;
	submitAddComment: (commentOrThread: string, isInlineComment: boolean) => void;
}) {
	const [content, setContent] = useState("");
	const [canSubmit, setCanSubmit] = useState(false);
	const boxRef = useRef<HTMLDivElement>(null);
	const selectionState = useMemo(
		() => ({
			container: document.createElement("div"),
			elements: [],
		}),
		[]
	);
	const author = "test";

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
					boxElem.style.left = `${correctedLeft}px`;
					boxElem.style.top = `${bottom + 20}px`;
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
	}, [editor, selectionState]);

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
			let quote = editor.getEditorState().read(() => {
				const selection = $getSelection();
				return selection !== null ? selection.getTextContent() : "";
			});
			if (quote.length > 100) {
				quote = quote.slice(0, 99) + "…";
			}
			submitAddComment("hi", true);
		}
	};

	return (
		<div
			className="fixed z-20 w-[250px] rounded-md border border-gray-200 shadow-md"
			ref={boxRef}
		>
			<div className="absolute top-[-1px] left-[105px] z-10 h-4 w-4 translate-x-1/2 -translate-y-1/2 rotate-45 transform border-l border-t border-gray-200 bg-white" />
			<div className="h-[145px]">
				<textarea className="textarea relative h-full w-full resize-none rounded-b-none rounded-t-md outline-none focus:outline-none" />
			</div>
			<div className="grid w-full grid-cols-2">
				<button
					onClick={cancelAddComment}
					className="btn-sm btn rounded-none rounded-bl-md"
				>
					Cancel
				</button>
				<button
					onClick={submitComment}
					disabled={!canSubmit}
					className="btn-sm btn rounded-none rounded-br-md"
				>
					Comment
				</button>
			</div>
		</div>
	);
}

const FloatingWordEditorPlugin = () => {
	const [editor] = useLexicalComposerContext();
	const [showInput, setShowInput] = useState(false);

	const insertComment = () => {
		editor.dispatchCommand(INSERT_WORD_COMMAND, undefined);
	};

	useEffect(() => {
		return editor.registerCommand(
			INSERT_WORD_COMMAND,
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

	return (
		<>
			{showInput && (
				<CommentInputBox
					cancelAddComment={function (): void {
						console.debug("cancel");
					}}
					editor={editor}
					submitAddComment={function (): void {
						console.debug("subtmi");
					}}
				/>
			)}
			<button onClick={() => setShowInput(!showInput)}>los</button>
		</>
	);
};

export default FloatingWordEditorPlugin;
