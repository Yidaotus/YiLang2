import grammarPointStyles from "./GrammarPoint.module.css";

import type {
	DOMConversionMap,
	EditorConfig,
	LexicalEditor,
	LexicalNode,
	RangeSelection,
	SerializedElementNode,
	Spread,
} from "lexical";
import { ElementNode } from "lexical";

type SerializedGrammarPointTitleNode = Spread<
	{
		type: "grammar-point-title";
		version: 1;
	},
	SerializedElementNode
>;

export class GrammarPointTitleNode extends ElementNode {
	static getType(): string {
		return "grammar-point-title";
	}

	static clone(node: GrammarPointTitleNode): GrammarPointTitleNode {
		return new GrammarPointTitleNode(node.__key);
	}

	createDOM(_config: EditorConfig, _editor: LexicalEditor): HTMLElement {
		const dom = document.createElement("div");
		dom.classList.add(
			grammarPointStyles.GrammarPoint__Title || "GrammarPoint__Title"
		);
		return dom;
	}

	updateDOM(_prevNode: GrammarPointTitleNode, _dom: HTMLElement): boolean {
		return false;
	}

	static importDOM(): DOMConversionMap | null {
		return {};
	}

	static importJSON(
		_serializedNode: SerializedGrammarPointTitleNode
	): GrammarPointTitleNode {
		return $createGrammarPointTitleNode();
	}

	exportJSON(): SerializedGrammarPointTitleNode {
		return {
			...super.exportJSON(),
			type: "grammar-point-title",
			version: 1,
		};
	}

	collapseAtStart(_selection: RangeSelection): boolean {
		this.getParentOrThrow().insertBefore(this);
		return true;
	}
}

export function $createGrammarPointTitleNode(): GrammarPointTitleNode {
	return new GrammarPointTitleNode();
}

export function $isGrammarPointTitleNode(
	node: LexicalNode | null | undefined
): node is GrammarPointTitleNode {
	return node instanceof GrammarPointTitleNode;
}
