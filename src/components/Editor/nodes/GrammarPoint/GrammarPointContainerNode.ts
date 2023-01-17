import grammarPointStyles from "./GrammarPoint.module.css";

import type {
	DOMConversionMap,
	EditorConfig,
	LexicalNode,
	NodeKey,
	SerializedElementNode,
	Spread,
} from "lexical";
import { ElementNode } from "lexical";

type SerializedGrammarPointContainerNode = Spread<
	{
		id: string | null;
		type: "grammar-point-container";
		version: 1;
	},
	SerializedElementNode
>;

export class GrammarPointContainerNode extends ElementNode {
	__id: string | null;

	constructor(id: string | null = null, key?: NodeKey) {
		super(key);
		this.__id = id;
	}
	databaseId = null;
	hasChangesForDatabase = false;
	shouldDeleteFromDatabaseOnRemove = true;

	static getType(): string {
		return "grammar-point-container";
	}

	static clone(node: GrammarPointContainerNode): GrammarPointContainerNode {
		return new GrammarPointContainerNode(node.__id, node.__key);
	}

	createDOM(_config: EditorConfig): HTMLElement {
		const dom = document.createElement("div");
		const domIcon = document.createElement("div");
		domIcon.classList.add(
			grammarPointStyles.GrammarPoint__ContainerIcon ||
				"GrammarPoint__ContainerIcon"
		);
		dom.classList.add(
			grammarPointStyles.GrammarPoint__Container || "GrammarPoint__Container"
		);
		dom.appendChild(domIcon);
		return dom;
	}

	updateDOM(
		_prevNode: GrammarPointContainerNode,
		_dom: HTMLDetailsElement
	): boolean {
		return false;
	}

	static importDOM(): DOMConversionMap | null {
		return {};
	}

	static importJSON(
		serializedNode: SerializedGrammarPointContainerNode
	): GrammarPointContainerNode {
		const node = $createGrammarPointContainerNode(serializedNode.id);
		return node;
	}

	exportJSON(): SerializedGrammarPointContainerNode {
		return {
			...super.exportJSON(),
			id: this.getId(),
			type: "grammar-point-container",
			version: 1,
		};
	}

	setId(id: string) {
		const writable = this.getWritable();
		writable.__id = id;
	}

	getId() {
		return this.__id;
	}
}

export function $createGrammarPointContainerNode(
	id: string | null = null
): GrammarPointContainerNode {
	return new GrammarPointContainerNode(id);
}

export function $isGrammarPointContainerNode(
	node: LexicalNode | null | undefined
): node is GrammarPointContainerNode {
	return node instanceof GrammarPointContainerNode;
}
