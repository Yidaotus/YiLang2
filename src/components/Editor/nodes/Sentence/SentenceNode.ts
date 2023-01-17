import type {
	EditorConfig,
	LexicalNode,
	NodeKey,
	RangeSelection,
	SerializedElementNode,
	Spread,
} from "lexical";

import { addClassNamesToElement } from "@lexical/utils";
import { $applyNodeReplacement, $isElementNode, ElementNode } from "lexical";
import sentenceNodeStyles from "./SentenceNode.module.css";

export type SerializedSentenceNode = Spread<
	{
		translation: string;
		type: "sentence";
		version: 1;
	},
	SerializedElementNode
>;

/** @noInheritDoc */
export class SentenceNode extends ElementNode {
	/** @internal */
	__translation: string;

	static getType(): string {
		return "sentence";
	}

	static clone(node: SentenceNode): SentenceNode {
		return new SentenceNode(node.__translation, node.__key);
	}

	static importDOM(): null {
		return null;
	}

	static importJSON(serializedNode: SerializedSentenceNode): SentenceNode {
		const node = $createSentenceNode(serializedNode.translation);
		node.setFormat(serializedNode.format);
		node.setIndent(serializedNode.indent);
		node.setDirection(serializedNode.direction);
		return node;
	}

	exportJSON(): SerializedSentenceNode {
		return {
			...super.exportJSON(),
			translation: this.getTranslation(),
			type: "sentence",
			version: 1,
		};
	}

	constructor(translation: string, key?: NodeKey) {
		super(key);
		this.__translation = translation || "";
	}
	save(): void {
		throw new Error("Method not implemented.");
	}

	createDOM(_config: EditorConfig): HTMLElement {
		const element = document.createElement("div");
		addClassNamesToElement(
			element,
			sentenceNodeStyles.SentenceNode || "SentenceNode"
		);
		return element;
	}

	updateDOM(
		_prevNode: SentenceNode,
		_element: HTMLElement,
		_config: EditorConfig
	): boolean {
		return false;
	}

	getTranslation(): string {
		const self = this.getLatest();
		return $isSentenceNode(self) ? self.__translation : "";
	}

	setTranslation(translation: string): void {
		const self = this.getWritable();
		self.__translation = translation;
	}

	insertNewAfter(
		selection: RangeSelection,
		restoreSelection = true
	): null | ElementNode {
		const element = this.getParentOrThrow().insertNewAfter(
			selection,
			restoreSelection
		);
		if ($isElementNode(element)) {
			const sentenceNode = $createSentenceNode(this.__translation);
			element.append(sentenceNode);
			return sentenceNode;
		}
		return null;
	}

	canInsertTextBefore(): false {
		return false;
	}

	canInsertTextAfter(): false {
		return false;
	}

	canBeEmpty(): false {
		return false;
	}

	isInline(): true {
		return true;
	}
}

export function $createSentenceNode(translation: string): SentenceNode {
	return $applyNodeReplacement(new SentenceNode(translation));
}

export function $isSentenceNode(
	node: LexicalNode | null | undefined
): node is SentenceNode {
	return node instanceof SentenceNode;
}
