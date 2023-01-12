import grammarPointStyles from "./GrammarPoint.module.css";

import type {
	DOMConversionMap,
	EditorConfig,
	LexicalNode,
	SerializedElementNode,
	Spread,
} from "lexical";
import { ElementNode } from "lexical";

type SerializedGrammarPointContentNode = Spread<
	{
		type: "grammar-point-content";
		version: 1;
	},
	SerializedElementNode
>;

export class GrammarPointContentNode extends ElementNode {
	static getType(): string {
		return "grammar-point-content";
	}

	static clone(node: GrammarPointContentNode): GrammarPointContentNode {
		return new GrammarPointContentNode(node.__key);
	}

	createDOM(_config: EditorConfig): HTMLElement {
		const dom = document.createElement("div");
		dom.classList.add(
			grammarPointStyles.GrammarPoint__Content || "GrammarPoint__Content"
		);
		return dom;
	}

	updateDOM(_prevNode: GrammarPointContentNode, _dom: HTMLElement): boolean {
		return false;
	}

	static importDOM(): DOMConversionMap | null {
		return {};
	}

	static importJSON(
		_serializedNode: SerializedGrammarPointContentNode
	): GrammarPointContentNode {
		return $createGrammarPointContentNode();
	}

	isShadowRoot(): boolean {
		return true;
	}

	exportJSON(): SerializedGrammarPointContentNode {
		return {
			...super.exportJSON(),
			type: "grammar-point-content",
			version: 1,
		};
	}
}

export function $createGrammarPointContentNode(): GrammarPointContentNode {
	return new GrammarPointContentNode();
}

export function $isGrammarPointContentNode(
	node: LexicalNode | null | undefined
): node is GrammarPointContentNode {
	return node instanceof GrammarPointContentNode;
}
