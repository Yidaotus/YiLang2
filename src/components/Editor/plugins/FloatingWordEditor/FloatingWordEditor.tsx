import type { LexicalEditor } from "lexical";
import { $getNodeByKey } from "lexical";

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
import useOnClickOutside from "@ui/hooks/useOnClickOutside";
import { CreatableSelect } from "chakra-react-select";
import { Box, Input, Stack, Button, ButtonGroup } from "@chakra-ui/react";
import React from "react";

type TagOption = {
	name: string;
	color: string;
};

const WordForm = () => {
	const [tagOptions, setOptions] = useState<Array<TagOption>>([
		{ name: "initial", color: "red" },
	]);

	return (
		<div>
			<form action="" className="flex flex-col gap-2">
				<Stack>
					<Input size="sm" placeholder="Translation" />
					<Input size="sm" placeholder="Spelling" />
					<CreatableSelect
						size="sm"
						placeholder="Tags"
						isMulti
						options={[...tagOptions, { name: "debug", color: "gray" }]}
						getOptionValue={(o) => o.name}
						getOptionLabel={(o) => o.name}
						onCreateOption={(newOpt) => {
							setOptions([...tagOptions, { name: newOpt, color: "yellow" }]);
						}}
						components={{
							Option: ({ children, data, innerProps}) => (
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
				</Stack>
			</form>
		</div>
	);
};

type CommentInputBoxProps = {
	cancelAddComment: () => void;
	editor: LexicalEditor;
	submitAddComment: (translation: string) => void;
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
			cancelAddComment,
			submitAddComment,
			anchorElem,
			show,
		}: CommentInputBoxProps,
		ref
	) => {
		const [content, setContent] = useState("");
		const canSubmit = content.length > 0;
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
							const color = "255, 212, 0";
							const style = `position:absolute;top:${
								selectionRect.top + window.scrollY
							}px;left:${selectionRect.left}px;height:${
								selectionRect.height
							}px;width:${
								selectionRect.width + window.scrollX
							}px;background-color:rgba(${color}, 0.3);pointer-events:none;z-index:5;`;
							elem.style.cssText = style;
						}
					}
				}
			});
		}, [anchorElem, editor, selectionState, show]);

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
			<Box
				sx={{
					pos: "absolute",
					top: 0,
					left: 0,
					zIndex: 20,
					p: 1,
					w: "300px",
					borderRadius: "3px",
					border: "1px solid #f4f4f4",
					bg: "white",
					boxShadow:
						"0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
					display: "flex",
					flexDir: "column",
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
				<WordForm />
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
					<Button variant="outline">Cancel</Button>
					<Button variant="solid" disabled={canSubmit}>
						Submit
					</Button>
				</ButtonGroup>
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
	const inputRef = useRef(null);
	const createWord = trpc.dictionary.createWord.useMutation();

	useOnClickOutside(inputRef, () => {
		if (showInput && inputRef.current) {
			console.debug("CLICK OUTSIDE");
			setShowInput(false);
		}
	});

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

	return createPortal(
		<CommentInputBox
			ref={inputRef}
			show={showInput}
			cancelAddComment={cancel}
			editor={editor}
			submitAddComment={insertWord}
			anchorElem={anchorElem}
		/>,
		anchorElem
	);
};

export default FloatingWordEditorPlugin;
