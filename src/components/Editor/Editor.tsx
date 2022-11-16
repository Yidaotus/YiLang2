import type { Klass, LexicalCommand, LexicalNode } from "lexical";

import { useRef } from "react";
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

import YiLangTheme from "./themes/YiLangEditorTheme";
import ErrorBoundary from "./ui/ErrorBoundary";
import { WordNode } from "../nodes/WordNode";
import FloatingTextFormatToolbarPlugin from "./plugins/FloatingToolbarPlugin";
import FloatingWordEditorPlugin from "./plugins/FloatingWordEditor/FloatingWordEditor";
import FetchDocumentPlugin from "./plugins/FetchDocumentPlugin/FetchDocumentPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin/ToolbarPlugin";
import PersistStateOnPageChangePlugion from "./plugins/PersistantStateOnPageChangePlugin/PersistantStateOnPageChangePlugin";

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

export const INSERT_WORD_COMMAND: LexicalCommand<void> = createCommand(
	"INSERT_WORD_COMMAND"
);

type EditorProps = {
	id?: string;
};

export default function Editor({ id }: EditorProps) {
	const editorRef = useRef<HTMLDivElement | null>(null);

	const initialConfig = {
		namespace: "MyEditor",
		theme: YiLangTheme,
		editorState: undefined,
		onError,
		nodes: [...EditorNodes],
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
										className="textarea-bordered textarea h-[75vh] overflow-scroll rounded-t-none"
										ref={editorRef}
									>
										<ContentEditable className="outline-none" />
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
						<FloatingWordEditorPlugin />
					</LexicalComposer>
					<div className="card-actions justify-end"></div>
				</div>
			</div>
		</div>
	);
}
