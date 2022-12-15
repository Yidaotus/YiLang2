import type { LexicalEditor } from "lexical";
import type { SelectedBlockType } from "../plugins/SelectedBlockTypePlugin/SelectedBlockTypePlugin";

import { $createParagraphNode } from "lexical";
import { $wrapNodes } from "@lexical/selection";
import {
	INSERT_CHECK_LIST_COMMAND,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
	REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { $getSelection, $isRangeSelection } from "lexical";
import type { HeadingTagType } from "@lexical/rich-text";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import * as React from "react";
import {
	RiDoubleQuotesL,
	RiH1,
	RiH2,
	RiListOrdered,
	RiListUnordered,
	RiParagraph,
} from "react-icons/ri";

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
				$wrapNodes(selection, () => $createParagraphNode());
			} else {
				$wrapNodes(selection, () => $createHeadingNode(headingSize));
			}
		}
	});
};

export const formatParagraph = ({
	editor,
	currentBlockType,
}: FormatterParams) => {
	if (currentBlockType !== "paragraph") {
		editor.update(() => {
			const selection = $getSelection();

			if ($isRangeSelection(selection)) {
				$wrapNodes(selection, () => $createParagraphNode());
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

export const blockTypes: Partial<Record<SelectedBlockType, any>> = {
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
};