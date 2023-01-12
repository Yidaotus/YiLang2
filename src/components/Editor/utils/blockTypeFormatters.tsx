import type { LexicalEditor } from "lexical";
import { $createTextNode, $getRoot, $insertNodes } from "lexical";
import type { SelectedBlockType } from "../plugins/SelectedBlockTypePlugin/SelectedBlockTypePlugin";

import {
	INSERT_CHECK_LIST_COMMAND,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
	REMOVE_LIST_COMMAND
} from "@lexical/list";
import type { HeadingTagType } from "@lexical/rich-text";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $setBlocksType_experimental, $wrapNodes } from "@lexical/selection";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import {
	$createParagraphNode,
	$getSelection,
	$isRangeSelection
} from "lexical";
import {
	RiDoubleQuotesL,
	RiH1,
	RiH2,
	RiInformationLine,
	RiListOrdered,
	RiListUnordered,
	RiParagraph,
	RiPencilLine,
	RiTabletLine
} from "react-icons/ri";
import { $createRemarkContainerNode } from "../nodes/Remark/RemarkContainerNode";
import { $createRemarkContentNode } from "../nodes/Remark/RemarkContentNode";
import { $createRemarkTitleNode } from "../nodes/Remark/RemarkTitleNode";

import { $createGrammarPointContainerNode } from "../nodes/GrammarPoint/GrammarPointContainerNode";
import { $createGrammarPointContentNode } from "../nodes/GrammarPoint/GrammarPointContentNode";
import { $createGrammarPointTitleNode } from "../nodes/GrammarPoint/GrammarPointTitleNode";

type FormatterParams = {
	editor: LexicalEditor;
	currentBlockType: string;
};

export const formatHeading = ({
	editor,
	headingSize,
	currentBlockType,
}: FormatterParams & {
	headingSize: HeadingTagType;
}) => {
	editor.update(() => {
		const selection = $getSelection();

		if ($isRangeSelection(selection)) {
			if (currentBlockType === headingSize) {
				$setBlocksType_experimental(selection, () => $createParagraphNode());
			} else {
				$setBlocksType_experimental(selection, () =>
					$createHeadingNode(headingSize)
				);
			}
		}
	});
};

export const formatGrammarPoint = ({
	editor,
	currentBlockType,
}: FormatterParams) => {
	if (currentBlockType !== "grammar-point") {
		editor.update(() => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				const anchorNode = selection.anchor.getNode();
				const focusNode = selection.focus.getNode();
				if (focusNode !== anchorNode) return false;

				const anchorParent = anchorNode.getParent();
				if (!anchorParent) return false;

				if (anchorParent === $getRoot()) {
					const title = $createGrammarPointTitleNode();
					const content = $createGrammarPointContentNode().append(
						$createParagraphNode().append($createTextNode(""))
					);
					const container = $createGrammarPointContainerNode().append(
						title,
						content
					);
					$insertNodes([container]);
					container.selectStart();
				} else {
					const anchorChildren = anchorParent.getChildren();
					const title = $createGrammarPointTitleNode();
					const content = $createGrammarPointContentNode().append(
						$createParagraphNode().append(...anchorChildren)
					);
					const container = $createGrammarPointContainerNode().append(
						title,
						content
					);
					anchorParent.replace(container);
					container.selectStart();
				}
				return true;
			}
		});
	}
};

export const formatRemark = ({ editor, currentBlockType }: FormatterParams) => {
	if (currentBlockType !== "remark") {
		editor.update(() => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				const anchorNode = selection.anchor.getNode();
				const focusNode = selection.focus.getNode();
				if (focusNode !== anchorNode) return false;

				const anchorParent = anchorNode.getParent();
				if (!anchorParent || anchorParent === $getRoot()) return false;

				const anchorChildren = anchorParent.getChildren();

				const title = $createRemarkTitleNode();
				const content = $createRemarkContentNode().append(
					$createParagraphNode().append(...anchorChildren)
				);
				const container = $createRemarkContainerNode().append(title, content);
				anchorParent.replace(container);
				container.selectStart();
			}
		});
	}
};

export const formatTable = ({ editor, currentBlockType }: FormatterParams) => {
	if (currentBlockType !== "table") {
		editor.update(() => {
			const selection = $getSelection();

			if ($isRangeSelection(selection)) {
				editor.dispatchCommand(INSERT_TABLE_COMMAND, {
					columns: "2",
					rows: "2",
				});
			}
		});
	}
};

export const formatParagraph = ({
	editor,
	currentBlockType,
}: FormatterParams) => {
	if (currentBlockType !== "paragraph") {
		editor.update(() => {
			const selection = $getSelection();

			if ($isRangeSelection(selection)) {
				$setBlocksType_experimental(selection, () => $createParagraphNode());
			}
		});
	}
};

export const formatBulletList = ({
	editor,
	currentBlockType,
}: FormatterParams) => {
	if (currentBlockType !== "bullet") {
		editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
	} else {
		editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
	}
};

export const formatCheckList = ({
	editor,
	currentBlockType,
}: FormatterParams) => {
	if (currentBlockType !== "check") {
		editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
	} else {
		editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
	}
};

export const formatNumberedList = ({
	editor,
	currentBlockType,
}: FormatterParams) => {
	if (currentBlockType !== "number") {
		editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
	} else {
		editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
	}
};

export const formatQuote = ({ editor, currentBlockType }: FormatterParams) => {
	if (currentBlockType !== "quote") {
		editor.update(() => {
			const selection = $getSelection();

			if ($isRangeSelection(selection)) {
				$wrapNodes(selection, () => $createQuoteNode());
			}
		});
	}
};

type Formatter = {
	type: string;
	icon: React.ReactElement;
	formatter: (params: FormatterParams) => void;
};

export const blockTypes: Partial<Record<SelectedBlockType, Formatter>> = {
	paragraph: {
		type: "Paragraph",
		icon: <RiParagraph size="100%" />,
		formatter: ({ editor, currentBlockType }: FormatterParams) =>
			formatParagraph({ editor, currentBlockType }),
	},
	h1: {
		type: "Title",
		icon: <RiH1 size="100%" />,
		formatter: ({ editor, currentBlockType }: FormatterParams) =>
			formatHeading({ editor, currentBlockType, headingSize: "h1" }),
	},
	h2: {
		type: "Subtitle",
		icon: <RiH2 size="100%" />,
		formatter: ({ editor, currentBlockType }: FormatterParams) =>
			formatHeading({ editor, currentBlockType, headingSize: "h2" }),
	},
	number: {
		type: "Numbered list",
		icon: <RiListOrdered size="100%" />,
		formatter: ({ editor, currentBlockType }: FormatterParams) =>
			formatNumberedList({ editor, currentBlockType }),
	},
	check: {
		type: "Check list",
		icon: <RiListUnordered size="100%" />,
		formatter: ({ editor, currentBlockType }: FormatterParams) =>
			formatCheckList({ editor, currentBlockType }),
	},
	bullet: {
		type: "Bullet List",
		icon: <RiListUnordered size="100%" />,
		formatter: ({ editor, currentBlockType }: FormatterParams) =>
			formatBulletList({ editor, currentBlockType }),
	},
	quote: {
		type: "Quote",
		icon: <RiDoubleQuotesL size="100%" />,
		formatter: ({ editor, currentBlockType }: FormatterParams) =>
			formatQuote({ editor, currentBlockType }),
	},
	remark: {
		type: "Remark",
		icon: <RiInformationLine size="100%" />,
		formatter: ({ editor, currentBlockType }: FormatterParams) =>
			formatRemark({ editor, currentBlockType }),
	},
	grammarPoint: {
		type: "Grammar Point",
		icon: <RiPencilLine size="100%" />,
		formatter: ({ editor, currentBlockType }: FormatterParams) =>
			formatGrammarPoint({ editor, currentBlockType }),
	},
	table: {
		type: "Table",
		icon: <RiTabletLine size="100%" />,
		formatter: ({ editor, currentBlockType }: FormatterParams) =>
			formatTable({ editor, currentBlockType }),
	},
};
