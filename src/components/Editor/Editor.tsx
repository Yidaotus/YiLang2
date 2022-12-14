import type { Klass, LexicalCommand, LexicalNode } from "lexical";

import { $getNodeByKey } from "lexical";
import { ListNode, ListItemNode } from "@lexical/list";
import { $createNodeSelection, $setSelection } from "lexical";

import React, { useCallback, useEffect, useState } from "react";
import { createCommand } from "lexical";

import { Box, Divider, IconButton } from "@chakra-ui/react";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HashtagNode } from "@lexical/hashtag";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { MarkNode } from "@lexical/mark";
import { OverflowNode } from "@lexical/overflow";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";

import YiLangTheme from "./themes/YiLangEditorTheme";
import ErrorBoundary from "./ui/ErrorBoundary";
import { WordNode } from "./nodes/WordNode";
import FloatingTextFormatToolbarPlugin from "./plugins/FloatingToolbarPlugin/FloatingToolbarPlugin";
import FloatingWordEditorPlugin from "./plugins/FloatingWordEditor/FloatingWordEditor";
import FetchDocumentPlugin from "./plugins/FetchDocumentPlugin/FetchDocumentPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin/ToolbarPlugin";
import PersistStateOnPageChangePlugion from "./plugins/PersistantStateOnPageChangePlugin/PersistantStateOnPageChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { createPortal } from "react-dom";
import { ImageNode } from "./nodes/ImageNode";
import ImagesPlugin from "./plugins/ImagePlugin/ImagePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import ListMaxIndentLevelPlugin from "./plugins/ListMaxIndentLevelPlugin/ListMaxIndentLevelPlugin";

import { IoSaveOutline } from "react-icons/io5";
import { RxFontBold } from "react-icons/rx";
import WordPopupPlugin from "./plugins/WordPopupPlugin/WordPopupPlugin";
import GetDocumentTitlePlugin from "./plugins/GetDocumentTitlePlugin/GetDocumentTitlePlugin";
import MinimapPlugin from "./plugins/MinimapPlugin/MinimapPlugin";

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

const WordListPlugin = () => {
	const [editor] = useLexicalComposerContext();
	const [wordStore, setWordStore] = useState<Record<string, string>>({});

	useEffect(() => {
		/*
			editor.registerDecoratorListener<any>((decorators) => {
				setWordStore(
					Object.entries(decorators)
						.filter(([key, value]) => value?.props?.word)
						.map(([key, value]) => ({
							key,
							text: value.props.word,
						}))
				);
			})
			*/
		// Fixed in 0.6.5 see https://github.com/facebook/lexical/issues/3490
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
				const nodeElem = editor.getElementByKey(key);
				if (nodeElem) {
					const newSelection = $createNodeSelection();
					newSelection.add(key);
					$setSelection(newSelection);
					nodeElem.scrollIntoView({
						block: "end",
						inline: "nearest",
					});
				}
			});
		},
		[editor]
	);

	return (
		<div>
			<ul>
				{Object.entries(wordStore).map(([nodeKey, word]) => (
					<li key={nodeKey}>
						<button onClick={() => highlightWord(nodeKey)}>{word}</button>
					</li>
				))}
			</ul>
		</div>
	);
};

type SidebarPluginProps = {
	sidebarPortal: HTMLElement;
};
const SidebarPlugin = ({ sidebarPortal }: SidebarPluginProps) => {
	return createPortal(
		<Box
			w="100%"
			pos="relative"
			display="grid"
			gridTemplateColumns="1fr 1fr"
			gap="4px"
			pt="1rem"
		>
			<Divider
				gridColumn="span 2"
				borderWidth="2px"
				borderRadius="3px"
				mb="0.5rem"
			/>
			<IconButton
				icon={
					<RxFontBold
						color="#696F80"
						style={{
							height: "24px",
							width: "24px",
						}}
					/>
				}
				aria-label="Bold"
				variant="ghost"
			/>
			<IconButton
				icon={
					<RxFontBold
						color="#696F80"
						style={{
							height: "24px",
							width: "24px",
						}}
					/>
				}
				aria-label="Bold"
				variant="ghost"
			/>
			<IconButton
				icon={
					<RxFontBold
						color="#696F80"
						style={{
							height: "24px",
							width: "24px",
						}}
					/>
				}
				aria-label="Bold"
				variant="ghost"
			/>
			<IconButton
				icon={
					<RxFontBold
						color="#696F80"
						style={{
							height: "24px",
							width: "24px",
						}}
					/>
				}
				aria-label="Bold"
				variant="ghost"
			/>
			<IconButton
				icon={
					<RxFontBold
						color="#696F80"
						style={{
							height: "24px",
							width: "24px",
						}}
					/>
				}
				aria-label="Bold"
				variant="ghost"
			/>
			<Divider
				gridColumn="span 2"
				borderWidth="2px"
				borderRadius="3px"
				mb="0.5rem"
			/>
			<IconButton
				icon={
					<IoSaveOutline
						color="#696F80"
						style={{
							height: "24px",
							width: "24px",
						}}
					/>
				}
				aria-label="Bold"
				variant="ghost"
			/>
		</Box>,
		sidebarPortal
	);
};

type EditorProps = {
	id?: string;
	scrollAnchor?: HTMLElement;
	sidebarPortal?: HTMLElement;
	setDocumentTitle: (title: string) => void;
};
export default function Editor({
	id,
	scrollAnchor,
	sidebarPortal,
	setDocumentTitle,
}: EditorProps) {
	const initialConfig = {
		namespace: "MyEditor",
		theme: YiLangTheme,
		editorState: undefined,
		onError,
		nodes: [...EditorNodes],
	};

	const [floatingAnchorElem, setFloatingAnchorElem] =
		useState<HTMLDivElement | null>(null);
	const onFloatingRef = (_floatingAnchorElem: HTMLDivElement) => {
		if (_floatingAnchorElem !== null) {
			setFloatingAnchorElem(_floatingAnchorElem);
		}
	};

	return (
		<Box>
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
				}}
			>
				<div>
					<LexicalComposer initialConfig={initialConfig}>
						<ToolbarPlugin documentId={id} />
						<RichTextPlugin
							contentEditable={
								<Box
									sx={{
										pos: "relative",
									}}
									ref={onFloatingRef}
								>
									<ContentEditable
										style={{
											outline: "none",
										}}
									/>
								</Box>
							}
							placeholder={<div>Enter some text...</div>}
							ErrorBoundary={ErrorBoundary}
						/>
						<HistoryPlugin />
						<PersistStateOnPageChangePlugion />
						<FetchDocumentPlugin id={id as string} />
						<TabIndentationPlugin />
						<ListMaxIndentLevelPlugin maxDepth={4} />
						<WordListPlugin />
						<GetDocumentTitlePlugin setDocumentTitle={setDocumentTitle} />
						<ListPlugin />
						<ImagesPlugin />
						<>
							{scrollAnchor && sidebarPortal && (
								<>
									<MinimapPlugin
										anchorElem={scrollAnchor}
										sidebarPortal={sidebarPortal}
									/>
									<SidebarPlugin sidebarPortal={sidebarPortal} />
								</>
							)}
							{floatingAnchorElem && (
								<>
									<FloatingTextFormatToolbarPlugin
										anchorElem={floatingAnchorElem}
									/>
									<FloatingWordEditorPlugin anchorElem={floatingAnchorElem} />
									<WordPopupPlugin anchorElem={floatingAnchorElem} />
								</>
							)}
						</>
					</LexicalComposer>
				</div>
			</Box>
		</Box>
	);
}
