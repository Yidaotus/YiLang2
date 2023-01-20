import type { LexicalEditor, LexicalNode } from "lexical";
import { $createTextNode, $isParagraphNode } from "lexical";
import type { SelectedBlockType } from "../plugins/SelectedBlockTypePlugin/SelectedBlockTypePlugin";

import {
	INSERT_CHECK_LIST_COMMAND,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
	REMOVE_LIST_COMMAND,
} from "@lexical/list";
import type { HeadingTagType } from "@lexical/rich-text";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $setBlocksType_experimental, $wrapNodes } from "@lexical/selection";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import { $findMatchingParent } from "@lexical/utils";
import {
	$createParagraphNode,
	$getSelection,
	$isRangeSelection,
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
	RiTabletLine,
} from "react-icons/ri";
import { $createRemarkContainerNode } from "../nodes/Remark/RemarkContainerNode";
import { $createRemarkContentNode } from "../nodes/Remark/RemarkContentNode";
import { $createRemarkTitleNode } from "../nodes/Remark/RemarkTitleNode";

import { IoChatboxOutline } from "react-icons/io5";
import {
	$createDialogueContainerNode,
	$createDialogueSpeakerNode,
	$createDialogueSpeechNode,
} from "../nodes/Dialogue";
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
				let selectionTarget;
				if (selection.isBackward()) {
					selectionTarget = selection.anchor.getNode();
				} else {
					selectionTarget = selection.focus.getNode();
				}
				if (!selectionTarget) return false;

				const topLevelElement = selectionTarget.getTopLevelElement();
				if (!topLevelElement) return false;

				const tempNode = $createParagraphNode();
				topLevelElement.insertAfter(tempNode);

				const title = $createGrammarPointTitleNode();
				const content = $createGrammarPointContentNode();
				const nodes = selection.getNodes();
				let previousParent: LexicalNode | null = null;
				for (const node of nodes) {
					const topLevelParent = node.getTopLevelElement();
					if (topLevelParent && previousParent !== topLevelParent) {
						content.append(topLevelParent);
						previousParent = topLevelElement;
					}
				}
				const container = $createGrammarPointContainerNode().append(
					title,
					content
				);

				tempNode.insertAfter(container);
				container.select();

				tempNode.remove();

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
				let selectionTarget;
				if (selection.isBackward()) {
					selectionTarget = selection.anchor.getNode();
				} else {
					selectionTarget = selection.focus.getNode();
				}
				if (!selectionTarget) return false;

				const topLevelElement = selectionTarget.getTopLevelElement();
				if (!topLevelElement) return false;

				const tempNode = $createParagraphNode();
				topLevelElement.insertAfter(tempNode);

				const title = $createRemarkTitleNode();
				const content = $createRemarkContentNode();
				const nodes = selection.getNodes();
				let previousParent: LexicalNode | null = null;
				for (const node of nodes) {
					const topLevelParent = node.getTopLevelElement();
					if (topLevelParent && previousParent !== topLevelParent) {
						content.append(topLevelParent);
						previousParent = topLevelElement;
					}
				}
				const container = $createRemarkContainerNode().append(title, content);

				tempNode.insertAfter(container);
				container.select();

				tempNode.remove();

				return true;
			}
		});
	}
};

export const formatDialogue = ({
	editor,
	currentBlockType,
}: FormatterParams) => {
	if (currentBlockType !== "dialogue") {
		editor.update(() => {
			const selection = $getSelection();
			if (!selection || !$isRangeSelection(selection)) return;

			const container = $createDialogueContainerNode();
			let lastTarget;
			const tmpNode = $createParagraphNode();
			let insertedTempNode = false;
			for (const node of selection.getNodes()) {
				if (!insertedTempNode) {
					const tlp = node.getTopLevelElement();
					if (tlp) {
						tlp.insertBefore(tmpNode);
						insertedTempNode = true;
					} else {
						return;
					}
				}
				const target = $findMatchingParent(node, $isParagraphNode);
				if (!target) continue;
				if (target.__key === lastTarget) continue;
				const text = target.getTextContent();
				const splits = text.split(":");
				if (splits.length > 1) {
					const [speaker, ...speech] = splits;
					const speakerNode = $createDialogueSpeakerNode().append(
						$createTextNode(speaker?.trim())
					);
					const speechNode = $createDialogueSpeechNode().append(
						$createTextNode(speech.join("").trim())
					);

					container.append(speakerNode, speechNode);
					target.remove();
				}
				lastTarget = target.__key;
			}

			if (container.getChildrenSize() < 1) {
				const speaker = $createDialogueSpeakerNode();
				const speech = $createDialogueSpeechNode();
				container.append(speaker, speech);
			}

			tmpNode.replace(container);
			container.selectStart();
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
	dialogue: {
		type: "Dialogue",
		icon: <IoChatboxOutline size="100%" />,
		formatter: ({ editor, currentBlockType }: FormatterParams) =>
			formatDialogue({ editor, currentBlockType }),
	},
};
