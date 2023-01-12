import remarkStyles from "./Remark.module.css";

import type {
	DOMConversionMap,
	EditorConfig,
	LexicalNode,
	SerializedElementNode,
	Spread,
} from "lexical";
import { ElementNode } from "lexical";

type SerializedRemarkContentNode = Spread<
	{
		type: "remark-content";
		version: 1;
	},
	SerializedElementNode
>;

export class RemarkContentNode extends ElementNode {
	static getType(): string {
		return "remark-content";
	}

	static clone(node: RemarkContentNode): RemarkContentNode {
		return new RemarkContentNode(node.__key);
	}

	createDOM(_config: EditorConfig): HTMLElement {
		const dom = document.createElement("div");
		dom.classList.add(remarkStyles.Remark__Content || "Remark__Content");
		return dom;
	}

	updateDOM(_prevNode: RemarkContentNode, _dom: HTMLElement): boolean {
		return false;
	}

	static importDOM(): DOMConversionMap | null {
		return {};
	}

	static importJSON(
		_serializedNode: SerializedRemarkContentNode
	): RemarkContentNode {
		return $createRemarkContentNode();
	}

	isShadowRoot(): boolean {
		return true;
	}

	exportJSON(): SerializedRemarkContentNode {
		return {
			...super.exportJSON(),
			type: "remark-content",
			version: 1,
		};
	}
}

export function $createRemarkContentNode(): RemarkContentNode {
	return new RemarkContentNode();
}

export function $isRemarkContentNode(
	node: LexicalNode | null | undefined
): node is RemarkContentNode {
	return node instanceof RemarkContentNode;
}
