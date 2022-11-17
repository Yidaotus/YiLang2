import {
	$getNodeByKey,
	$getSelection,
	$isNodeSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_LOW,
	Klass,
	LexicalCommand,
	LexicalNode,
	NodeSelection,
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
import { $findMatchingParent, mergeRegister } from "@lexical/utils";

import YiLangTheme from "./themes/YiLangEditorTheme";
import ErrorBoundary from "./ui/ErrorBoundary";
import { $isWordNode, WordNode } from "../nodes/WordNode";
import FloatingTextFormatToolbarPlugin from "./plugins/FloatingToolbarPlugin";
import FloatingWordEditorPlugin from "./plugins/FloatingWordEditor/FloatingWordEditor";
import FetchDocumentPlugin from "./plugins/FetchDocumentPlugin/FetchDocumentPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin/ToolbarPlugin";
import PersistStateOnPageChangePlugion from "./plugins/PersistantStateOnPageChangePlugin/PersistantStateOnPageChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { createPortal } from "react-dom";
import { setFloatingElemPosition } from "./utils/setFloatingPosition";

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

const WordStore = new Map<string, string>();

const WordPopupPlugin = ({ anchorElem }: { anchorElem: HTMLElement }) => {
	const [show, setShow] = useState(false);
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
		return editor.registerMutationListener(WordNode, (mutatedNodes) => {
			for (const [nodeKey, mutation] of mutatedNodes) {
				if (mutation === "created") {
					editor.getEditorState().read(() => {
						const wordNode = $getNodeByKey(nodeKey) as WordNode;

						if (!WordStore.has(nodeKey)) {
							WordStore.set(nodeKey, wordNode.getWord());
						}
					});
				}
				if (mutation === "destroyed") {
					WordStore.delete(nodeKey);
				}
				console.debug({ WordStore });
			}
		});
	});

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
			className={`${
				wordNode ? "opacity-100" : "opacity-0"
			} absolute top-0 left-0 z-30 w-32 rounded-sm
			 border
			 border-slate-200 bg-slate-100 p-2 transition-opacity ease-in-out`}
		>
			<div className="relative">
				<div
					className="absolute top-[-8px] left-[50px]
				 z-10 h-2 w-2 translate-x-1/2 -translate-y-1/2 rotate-45 transform border-l
				  border-t border-slate-200 bg-slate-100"
				/>
				{wordNode?.translation}
			</div>
		</div>,
		anchorElem
	);
};

export default function Editor({ id }: EditorProps) {
	const editorRef = useRef(null);

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
		<div className="card min-h-[70vh] w-full bg-base-200 px-4 shadow-xl md:w-10/12">
			<div className="card-body p-0 md:p-10">
				<h2 className="card-title">Editor</h2>
				<div>
					<LexicalComposer initialConfig={initialConfig}>
						<ToolbarPlugin />
						<RichTextPlugin
							contentEditable={
								<div className="relative">
									<div
										className="textarea-bordered textarea h-[80%] overflow-scroll rounded-t-none"
										ref={onRef}
									>
										<ContentEditable className="h-[80%] outline-none" />
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
						<>
							{floatingAnchorElem && (
								<>
									<FloatingWordEditorPlugin anchorElem={floatingAnchorElem} />
									<WordPopupPlugin anchorElem={floatingAnchorElem} />
								</>
							)}
						</>
					</LexicalComposer>
					<div className="card-actions justify-end"></div>
				</div>
			</div>
		</div>
	);
}
