import type { EditorState, Klass, LexicalNode, NodeKey } from "lexical";
import { $isNodeSelection } from "lexical";
import {
	$createParagraphNode,
	$getRoot,
	$getSelection,
	$isRangeSelection,
	$isRootOrShadowRoot,
	COMMAND_PRIORITY_CRITICAL,
	SELECTION_CHANGE_COMMAND,
	$createNodeSelection,
	$setSelection,
} from "lexical";

import { useCallback, useEffect, useRef, useState } from "react";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
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
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { HeadingTagType } from "@lexical/rich-text";
import { $createHeadingNode, $isHeadingNode } from "@lexical/rich-text";
import { $wrapNodes } from "@lexical/selection";
import YiLangTheme from "./themes/YiLangEditorTheme";
import ErrorBoundary from "./ui/ErrorBoundary";
import { $createWordNode, WordNode } from "../nodes/WordNode";
import { trpc } from "../../utils/trpc";
import FloatingTextFormatToolbarPlugin from "./plugins/FloatingToolbarPlugin";
import useBearStore from "../../store/store";
import { useRouter } from "next/router";

// When the editor changes, you can get notified via the
// LexicalOnChangePlugin!
function onChange(editorState: EditorState) {
	editorState.read(() => {
		// Read the contents of the EditorState here.
		const root = $getRoot();
		const selection = $getSelection();

		// console.log(root, selection);
	});
}

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

const blockTypeToBlockName = {
	bullet: "Bulleted List",
	check: "Check List",
	code: "Code Block",
	h1: "Heading 1",
	h2: "Heading 2",
	h3: "Heading 3",
	h4: "Heading 4",
	h5: "Heading 5",
	h6: "Heading 6",
	number: "Numbered List",
	paragraph: "Normal",
	quote: "Quote",
};

const WordStore = new Map<NodeKey, string>();

const PersistStateOnPageChangePlugion = () => {
	const [editor] = useLexicalComposerContext();
	const editorState = useBearStore((state) => state.editorState);
	const setEditorState = useBearStore((state) => state.setEditorState);
	const router = useRouter();

	useEffect(() => {
		if (editorState) {
			const savedEditorState = editor.parseEditorState(editorState);
			editor.setEditorState(savedEditorState);
		}
	}, [editor, editorState]);

	useEffect(() => {
		const handleRouteChange = () => {
			setEditorState(JSON.stringify(editor.getEditorState()));
		};

		router.events.on("routeChangeStart", handleRouteChange);
		return () => {
			router.events.off("routeChangeStart", handleRouteChange);
		};
	}, [editor, router, setEditorState]);

	return null;
};

const ToolbarPlugin = () => {
	const [editor] = useLexicalComposerContext();
	const createWord = trpc.dictionary.createWord.useMutation();
	const [blockType, setBlockType] =
		useState<keyof typeof blockTypeToBlockName>("paragraph");

	const updateToolbar = useCallback(() => {
		const selection = $getSelection();
		if ($isRangeSelection(selection)) {
			const anchorNode = selection.anchor.getNode();
			let element =
				anchorNode.getKey() === "root"
					? anchorNode
					: $findMatchingParent(anchorNode, (e) => {
							const parent = e.getParent();
							return parent !== null && $isRootOrShadowRoot(parent);
					  });

			if (element === null) {
				element = anchorNode.getTopLevelElementOrThrow();
			}

			const elementKey = element.getKey();
			const elementDOM = editor.getElementByKey(elementKey);

			if (elementDOM !== null) {
				const type = $isHeadingNode(element)
					? element.getTag()
					: element.getType();
				if (type in blockTypeToBlockName) {
					setBlockType(type as keyof typeof blockTypeToBlockName);
				}
			}
		}
		if ($isNodeSelection(selection)) {
			const anchorNode = selection.getNodes()[0];
			if (!anchorNode) {
				return;
			}
			let element =
				anchorNode.getKey() === "root"
					? anchorNode
					: $findMatchingParent(anchorNode, (e) => {
							const parent = e.getParent();
							return parent !== null && $isRootOrShadowRoot(parent);
					  });

			if (element === null) {
				element = anchorNode.getTopLevelElementOrThrow();
			}

			const elementKey = element.getKey();
			const elementDOM = editor.getElementByKey(elementKey);

			if (elementDOM !== null) {
				const type = $isHeadingNode(element)
					? element.getTag()
					: element.getType();
				if (type in blockTypeToBlockName) {
					setBlockType(type as keyof typeof blockTypeToBlockName);
				}
			}
		}
	}, [editor]);

	useEffect(() => {
		return mergeRegister(
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					updateToolbar();
					return false;
				},
				COMMAND_PRIORITY_CRITICAL
			),
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(() => {
					updateToolbar();
				});
			})
		);
	}, [editor, updateToolbar]);

	const formatHeading = (headingSize: HeadingTagType) => () => {
		editor.update(() => {
			const selection = $getSelection();

			if ($isRangeSelection(selection)) {
				if (blockType === headingSize) {
					$wrapNodes(selection, () => $createParagraphNode());
				} else {
					$wrapNodes(selection, () => $createHeadingNode(headingSize));
				}
			}
		});
	};

	const selectWord = useCallback(() => {
		editor.update(() => {
			const [targetKey] = WordStore.keys();

			if (!targetKey) {
				return;
			}

			const nodeSelection = $createNodeSelection();
			nodeSelection.add(targetKey);
			$setSelection(nodeSelection);
		});
	}, [editor]);

	const insertWord = useCallback(async () => {
		const translation = "translation123";
		const word = await editor.getEditorState().read(async () => {
			const selection = $getSelection();
			if (!selection) {
				return;
			}
			const text = selection.getTextContent();
			return text;
		});
		if (!word) {
			return;
		}

		const newWord = await createWord.mutateAsync({ translation, word });
		editor.update(async () => {
			const selection = $getSelection();

			if ($isRangeSelection(selection)) {
				const newWordNode = $createWordNode(
					newWord.translation,
					newWord.word,
					newWord.id
				);
				WordStore.set(newWordNode.getKey(), word);
				selection.insertNodes([newWordNode]);
			}
		});
	}, [createWord, editor]);

	return (
		<div className="textarea-bordered textarea w-full rounded-b-none p-0">
			<div className="flex gap-1 p-1">
				<div className="dropdown">
					<label tabIndex={0} className="btn-ghost btn">
						Click
					</label>
					<ul
						tabIndex={0}
						className="dropdown-content menu mt-2 rounded-sm bg-base-100 p-2 shadow-lg"
					>
						<li>
							<a
								className={`${blockType === "h1" && "bg-slate-200"}`}
								onClick={formatHeading("h1")}
							>
								H1
							</a>
						</li>
						<li>
							<a>H2</a>
						</li>
					</ul>
				</div>
				<button
					className={`btn-ghost btn ${blockType === "h1" && "btn-active"}`}
					onClick={formatHeading("h1")}
				>
					h1
				</button>
				<button
					className={`btn-ghost btn ${blockType === "h2" && "btn-active"}`}
					onClick={formatHeading("h2")}
				>
					h2
				</button>
				<button className="btn-ghost btn" onClick={insertWord}>
					Word
				</button>
				<button className="btn-ghost btn" onClick={selectWord}>
					Select Word
				</button>
			</div>
		</div>
	);
};

export default function Editor() {
	const editorRef = useRef<HTMLDivElement | null>(null);

	const initialConfig = {
		namespace: "MyEditor",
		theme: YiLangTheme,
		editorState: undefined,
		onError,
		nodes: [...EditorNodes],
	};

	return (
		<div className="card w-10/12 bg-base-200 shadow-xl">
			<div className="card-body">
				<h2 className="card-title">Shoes!</h2>
				<div>
					<LexicalComposer initialConfig={initialConfig}>
						<ToolbarPlugin />
						<RichTextPlugin
							contentEditable={
								<div className="relative">
									<div
										className="textarea-bordered textarea  rounded-t-none"
										ref={editorRef}
									>
										<ContentEditable className="min-h-[512px] outline-none" />
									</div>
								</div>
							}
							placeholder={<div>Enter some text...</div>}
							ErrorBoundary={ErrorBoundary}
						/>
						<FloatingTextFormatToolbarPlugin />
						<OnChangePlugin onChange={onChange} />
						<HistoryPlugin />
						<PersistStateOnPageChangePlugion />
					</LexicalComposer>
					<div className="card-actions justify-end"></div>
				</div>
			</div>
		</div>
	);
}
