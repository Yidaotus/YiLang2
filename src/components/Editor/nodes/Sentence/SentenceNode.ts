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
		showTranslation: boolean;
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
	__showTranslation: boolean;
	__databaseId: string | null;

	static getType(): string {
		return "sentence";
	}

	static clone(node: SentenceNode): SentenceNode {
		return new SentenceNode(
			node.__translation,
			node.__databaseId,
			node.__showTranslation,
			node.__key
		);
	}

	static importDOM(): null {
		return null;
	}

	static importJSON(serializedNode: SerializedSentenceNode): SentenceNode {
		const node = $createSentenceNode(
			serializedNode.translation,
			serializedNode.databaseId,
			serializedNode.showTranslation
		);
		return node;
	}

	exportJSON(): SerializedSentenceNode {
		return {
			...super.exportJSON(),
			databaseId: this.getDatabaseId(),
			translation: this.getTranslation(),
			showTranslation: this.getShowTranslation(),
			type: "sentence",
			version: 1,
		};
	}

	constructor(
		translation: string,
		databaseId: string | null,
		showTranslation: boolean,
		key?: NodeKey
	) {
		super(key);
		this.__databaseId = databaseId;
		this.__translation = translation || "";
		this.__showTranslation = showTranslation;
	}
	save(): void {
		throw new Error("Method not implemented.");
	}

	createDOM(_config: EditorConfig): HTMLElement {
		const element = document.createElement("mark");
		element.dataset.translation = this.getTranslation();
		if (this.getShowTranslation()) {
			element.classList.add(
				sentenceNodeStyles.SentenceNodeWithTranslation ||
					"SentenceNodeWithTranslation"
			);
		} else {
			addClassNamesToElement(
				element,
				sentenceNodeStyles.SentenceNode || "SentenceNode"
			);
		}
		return element;
	}

	updateDOM(
		prevNode: SentenceNode,
		element: HTMLElement,
		_config: EditorConfig
	): boolean {
		if (prevNode.__translation !== this.__translation) {
			element.dataset.translation = this.__translation;
		}
		if (prevNode.__showTranslation !== this.__showTranslation) {
			if (this.getShowTranslation()) {
				element.classList.remove(
					sentenceNodeStyles.SentenceNode || "SentenceNode"
				);
				element.classList.add(
					sentenceNodeStyles.SentenceNodeWithTranslation ||
						"SentenceNodeWithTranslation"
				);
			} else {
				element.classList.add(
					sentenceNodeStyles.SentenceNode || "SentenceNode"
				);
				element.classList.remove(
					sentenceNodeStyles.SentenceNodeWithTranslation ||
						"SentenceNodeWithTranslation"
				);
			}
		}
		return false;
	}

	getShowTranslation() {
		const self = this.getLatest();
		return self.__showTranslation;
	}

	setShowTranslation(showTranslation: boolean): void {
		const self = this.getWritable();
		self.__showTranslation = showTranslation;
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
				this.__databaseId,
				this.__showTranslation
			);
			element.append(sentenceNode);
			return sentenceNode;
		}
		return null;
	}

	canInsertTextBefore(): true {
		return true;
	}

	canInsertTextAfter(): true {
		return true;
	}

	canBeEmpty(): false {
		return false;
	}

	canMergeWith(node: ElementNode): boolean {
		return $isSentenceNode(node);
	}

	isInline(): true {
		return true;
	}
}

export function $createSentenceNode(
	translation: string,
	databaseId: string | null,
	showTranslation: boolean
): SentenceNode {
	return new SentenceNode(translation, databaseId, showTranslation);
}

export function $isSentenceNode(
	node: LexicalNode | null | undefined
): node is SentenceNode {
	return node instanceof SentenceNode;
}
