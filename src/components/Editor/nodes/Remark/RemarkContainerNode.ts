import remarkStyles from "./Remark.module.css";

import type {
	DOMConversionMap,
	EditorConfig,
	LexicalNode,
	NodeKey,
	SerializedElementNode,
	Spread,
} from "lexical";
import { ElementNode } from "lexical";

type SerializedRemarkContainerNode = Spread<
	{
		type: "remark-container";
		version: 1;
	},
	SerializedElementNode
>;

export class RemarkContainerNode extends ElementNode {
	__open: boolean;

	constructor(open: boolean, key?: NodeKey) {
		super(key);
		this.__open = open;
	}

	static getType(): string {
		return "remark-container";
	}

	static clone(node: RemarkContainerNode): RemarkContainerNode {
		return new RemarkContainerNode(node.__open, node.__key);
	}

	createDOM(_config: EditorConfig): HTMLElement {
		const dom = document.createElement("div");
		const domIcon = document.createElement("div");
		domIcon.classList.add(
			remarkStyles.Remark__ContainerIcon || "Remark__ContainerIcon"
		);
		dom.classList.add(remarkStyles.Remark__Container || "Remark__Container");
		dom.appendChild(domIcon);
		return dom;
	}

	updateDOM(prevNode: RemarkContainerNode, dom: HTMLDetailsElement): boolean {
		if (prevNode.__open !== this.__open) {
			dom.open = this.__open;
		}

		return false;
	}

	static importDOM(): DOMConversionMap | null {
		return {};
	}

	static importJSON(
		_serializedNode: SerializedRemarkContainerNode
	): RemarkContainerNode {
		const node = $createRemarkContainerNode();
		return node;
	}

	exportJSON(): SerializedRemarkContainerNode {
		return {
			...super.exportJSON(),
			type: "remark-container",
			version: 1,
		};
	}
}

export function $createRemarkContainerNode(): RemarkContainerNode {
	return new RemarkContainerNode(true);
}

export function $isRemarkContainerNode(
	node: LexicalNode | null | undefined
): node is RemarkContainerNode {
	return node instanceof RemarkContainerNode;
}
