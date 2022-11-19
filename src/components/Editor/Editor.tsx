import type { Klass, LexicalCommand, LexicalNode } from "lexical";
import {
	$createNodeSelection,
	$getNodeByKey,
	$getSelection,
	$isNodeSelection,
	$setSelection,
	COMMAND_PRIORITY_LOW,
	SELECTION_CHANGE_COMMAND,
} from "lexical";

import { useCallback, useEffect, useRef, useState } from "react";
import { createCommand } from "lexical";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HashtagNode } from "@lexical/hashtag";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { MarkNode } from "@lexical/mark";
import { OverflowNode } from "@lexical/overflow";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { mergeRegister } from "@lexical/utils";

import YiLangTheme from "./themes/YiLangEditorTheme";
import ErrorBoundary from "./ui/ErrorBoundary";
import { $isWordNode, WordNode } from "./nodes/WordNode";
import FloatingTextFormatToolbarPlugin from "./plugins/FloatingToolbarPlugin";
import FloatingWordEditorPlugin from "./plugins/FloatingWordEditor/FloatingWordEditor";
import FetchDocumentPlugin from "./plugins/FetchDocumentPlugin/FetchDocumentPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin/ToolbarPlugin";
import PersistStateOnPageChangePlugion from "./plugins/PersistantStateOnPageChangePlugin/PersistantStateOnPageChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { createPortal } from "react-dom";
import { setFloatingElemPosition } from "./utils/setFloatingPosition";
import { ImageNode } from "./nodes/ImageNode";
import ImagesPlugin from "./plugins/ImagePlugin/ImagePlugin";

const EditorNodes: Array<Klass<LexicalNode>> = [
	HeadingNode,
	ListNode,
	ListItemNode,
	QuoteNode,
	CodeNode,
	TableNode,
	TableCellNode,
	TableRowNode,
	HashtagNode,
	CodeHighlightNode,
	AutoLinkNode,
	LinkNode,
	OverflowNode,
	HorizontalRuleNode,
	ImageNode,
	MarkNode,
	WordNode,
];

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: Error) {
	console.error(error);
}

export const SHOW_FLOATING_WORD_EDITOR_COMMAND: LexicalCommand<void> =
	createCommand("SHOW_FLOATING_WORD_EDITOR_COMMAN");

type EditorProps = {
	id?: string;
};

const WordPopupPlugin = ({ anchorElem }: { anchorElem: HTMLElement }) => {
	const elem = useRef<HTMLDivElement | null>(null);
	const [wordNode, setWordNode] = useState<{
		word: string;
		translation: string;
	} | null>(null);
	const [editor] = useLexicalComposerContext();

	const updatePopup = useCallback(() => {
		if (!elem.current) return;

		const selection = $getSelection();

		if (!$isNodeSelection(selection)) {
			setFloatingElemPosition(null, elem.current, anchorElem);
			return;
		}

		const node = selection.getNodes();
		if (node.length < 1) return;

		const target = node[0];
		if (!$isWordNode(target)) return;

		setWordNode({
			word: target.getWord(),
			translation: target.getTranslation(),
		});
		const domPos = editor.getElementByKey(target.getKey());

		if (!domPos || !elem.current) return;
		const clientRect = domPos.getBoundingClientRect();
		const elemRect = elem.current.getBoundingClientRect();

		setFloatingElemPosition(
			clientRect,
			elem.current,
			anchorElem,
			-clientRect.height - elemRect.height - 7,
			elemRect.width / 2 - clientRect.width / 2
		);
	}, [anchorElem, editor]);

	useEffect(() => {
		document.addEventListener("resize", updatePopup);
		return () => document.removeEventListener("resize", updatePopup);
	}, [updatePopup]);

	useEffect(() => {
		return mergeRegister(
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					updatePopup();
					return false;
				},
				COMMAND_PRIORITY_LOW
			),
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(() => {
					updatePopup();
				});
			})
		);
	}, [editor, updatePopup]);

	return createPortal(
		<div
			ref={elem}
			className={`${wordNode ? "opacity-100" : "opacity-0"}
			 absolute top-0 left-0 z-30 w-32 rounded-sm border
			 border-base-200 bg-base-100 p-2 transition-opacity duration-75 ease-out`}
		>
			<div className="relative">
				<div
					className="absolute top-[-8px] left-[50px]
				 z-10 h-2 w-2 translate-x-1/2 -translate-y-1/2 rotate-45 transform border-l
				  border-t border-base-200 bg-base-100"
				/>
				{wordNode?.translation}
			</div>
		</div>,
		anchorElem
	);
};

const WordListPlugin = () => {
	const [editor] = useLexicalComposerContext();
	const [wordStore, setWordStore] = useState<{ [key in string]: string }>({});

	useEffect(() => {
		return editor.registerMutationListener(WordNode, (mutatedNodes) => {
			for (const [nodeKey, mutation] of mutatedNodes) {
				if (mutation === "created") {
					editor.getEditorState().read(() => {
						const wordNode = $getNodeByKey(nodeKey) as WordNode;
						const wordText = wordNode.getWord();
						setWordStore((currentStore) => ({
							...currentStore,
							[nodeKey]: wordText,
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
			editor.update(() => {
				const newSelection = $createNodeSelection();
				newSelection.add(key);
				$setSelection(newSelection);
			});
		},
		[editor]
	);

	return (
		<div>
			<ul>
				{Object.entries(wordStore).map(([key, value]) => (
					<li key={value}>
						<button onClick={() => highlightWord(key)}>{value}</button>
					</li>
				))}
			</ul>
		</div>
	);
};

export default function Editor({ id }: EditorProps) {
	const initialConfig = {
		namespace: "MyEditor",
		theme: YiLangTheme,
		editorState: undefined,
		onError,
		nodes: [...EditorNodes],
	};

	const [floatingAnchorElem, setFloatingAnchorElem] =
		useState<HTMLDivElement | null>(null);

	const onRef = (_floatingAnchorElem: HTMLDivElement) => {
		if (_floatingAnchorElem !== null) {
			setFloatingAnchorElem(_floatingAnchorElem);
		}
	};

	return (
		<div className="w-full bg-base-200 px-4 shadow-xl md:w-10/12">
			<div className="p-0 md:p-10">
				<div>
					<LexicalComposer initialConfig={initialConfig}>
						<ToolbarPlugin />
						<RichTextPlugin
							contentEditable={
								<div>
									<div
										className="flex justify-center py-4 pr-2 scrollbar-thin scrollbar-track-base-500 scrollbar-thumb-base-600"
										ref={onRef}
									>
										<ContentEditable className="prose min-h-full max-w-[700px] outline-none selection:bg-[#b3d4fc]" />
									</div>
								</div>
							}
							placeholder={<div>Enter some text...</div>}
							ErrorBoundary={ErrorBoundary}
						/>
						<FloatingTextFormatToolbarPlugin />
						<HistoryPlugin />
						<PersistStateOnPageChangePlugion />
						<FetchDocumentPlugin id={id as string} />
						<WordListPlugin />
						<ImagesPlugin />
						<>
							{floatingAnchorElem && (
								<>
									<FloatingWordEditorPlugin anchorElem={floatingAnchorElem} />
									<WordPopupPlugin anchorElem={floatingAnchorElem} />
								</>
							)}
						</>
					</LexicalComposer>
				</div>
			</div>
		</div>
	);
}
