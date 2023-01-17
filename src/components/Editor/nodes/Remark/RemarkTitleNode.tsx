import remarkStyles from "./Remark.module.css";

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

type SerializedRemarkTitleNode = Spread<
	{
		type: "remark-title";
		version: 1;
	},
	SerializedElementNode
>;

export class RemarkTitleNode extends ElementNode {
	static getType(): string {
		return "remark-title";
	}

	static clone(node: RemarkTitleNode): RemarkTitleNode {
		return new RemarkTitleNode(node.__key);
	}

	createDOM(_config: EditorConfig, _editor: LexicalEditor): HTMLElement {
		const dom = document.createElement("div");
		dom.classList.add(remarkStyles.Remark__Title || "Remark__Title");
		return dom;
	}

	updateDOM(_prevNode: RemarkTitleNode, _dom: HTMLElement): boolean {
		return false;
	}

	static importDOM(): DOMConversionMap | null {
		return {};
	}

	static importJSON(
		_serializedNode: SerializedRemarkTitleNode
	): RemarkTitleNode {
		return $createRemarkTitleNode();
	}

	exportJSON(): SerializedRemarkTitleNode {
		return {
			...super.exportJSON(),
			type: "remark-title",
			version: 1,
		};
	}

	collapseAtStart(_selection: RangeSelection): boolean {
		this.getParentOrThrow().insertBefore(this);
		return true;
	}
}

export function $createRemarkTitleNode(): RemarkTitleNode {
	return new RemarkTitleNode();
}

export function $isRemarkTitleNode(
	node: LexicalNode | null | undefined
): node is RemarkTitleNode {
	return node instanceof RemarkTitleNode;
}
