import type {
	EditorConfig,
	LexicalNode,
	NodeKey,
	RangeSelection,
	SerializedElementNode,
	Spread,
} from "lexical";

import { addClassNamesToElement } from "@lexical/utils";
import { $isElementNode, ElementNode } from "lexical";
import sentenceNodeStyles from "./SentenceNode.module.scss";

export type SerializedSentenceNode = Spread<
	{
		databaseId: string | null;
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
	__databaseId: string | null;

	static getType(): string {
		return "sentence";
	}

	static clone(node: SentenceNode): SentenceNode {
		return new SentenceNode(node.__translation, node.__databaseId, node.__key);
	}

	static importDOM(): null {
		return null;
	}

	static importJSON(serializedNode: SerializedSentenceNode): SentenceNode {
		const node = $createSentenceNode(
			serializedNode.translation,
			serializedNode.databaseId
		);
		return node;
	}

	exportJSON(): SerializedSentenceNode {
		return {
			...super.exportJSON(),
			databaseId: this.getDatabaseId(),
			translation: this.getTranslation(),
			type: "sentence",
			version: 1,
		};
	}

	constructor(translation: string, databaseId: string | null, key?: NodeKey) {
		super(key);
		this.__databaseId = databaseId;
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

	getDatabaseId() {
		const self = this.getLatest();
		return self.__databaseId;
	}

	setDatabaseId(databaseId: string): void {
		const self = this.getWritable();
		self.__databaseId = databaseId;
	}

	getTranslation(): string {
		const self = this.getLatest();
		return self.__translation;
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
			const sentenceNode = $createSentenceNode(
				this.__translation,
				this.__databaseId
			);
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

export function $createSentenceNode(
	translation: string,
	databaseId: string | null
): SentenceNode {
	return new SentenceNode(translation, databaseId);
}

export function $isSentenceNode(
	node: LexicalNode | null | undefined
): node is SentenceNode {
	return node instanceof SentenceNode;
}
