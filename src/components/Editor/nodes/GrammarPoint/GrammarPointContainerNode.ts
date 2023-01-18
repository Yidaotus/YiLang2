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
		databaseId: string | null;
		type: "grammar-point-container";
		version: 1;
	},
	SerializedElementNode
>;

export class GrammarPointContainerNode extends ElementNode {
	__databaseId: string | null;

	constructor(id: string | null = null, key?: NodeKey) {
		super(key);
		this.__databaseId = id;
	}
	databaseId = null;
	hasChangesForDatabase = false;
	shouldDeleteFromDatabaseOnRemove = true;

	static getType(): string {
		return "grammar-point-container";
	}

	static clone(node: GrammarPointContainerNode): GrammarPointContainerNode {
		return new GrammarPointContainerNode(node.__databaseId, node.__key);
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
		const node = $createGrammarPointContainerNode(serializedNode.databaseId);
		return node;
	}

	exportJSON(): SerializedGrammarPointContainerNode {
		return {
			...super.exportJSON(),
			databaseId: this.getDatabaseId(),
			type: "grammar-point-container",
			version: 1,
		};
	}

	setDatabaseId(id: string) {
		const writable = this.getWritable();
		writable.__databaseId = id;
	}

	getDatabaseId() {
		const current = this.getLatest();
		return current.__databaseId;
	}
}

export function $createGrammarPointContainerNode(
	databaseId: string | null = null
): GrammarPointContainerNode {
	return new GrammarPointContainerNode(databaseId);
}

export function $isGrammarPointContainerNode(
	node: LexicalNode | null | undefined
): node is GrammarPointContainerNode {
	return node instanceof GrammarPointContainerNode;
}
