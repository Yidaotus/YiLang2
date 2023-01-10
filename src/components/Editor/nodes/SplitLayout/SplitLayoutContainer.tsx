import splitLayoutContainerStyles from "./SplitLayoutContainer.module.scss";

import type {
	DOMConversionMap,
	LexicalNode,
	NodeKey,
	SerializedElementNode,
	Spread,
} from "lexical";
import { ElementNode } from "lexical";

type SerializedSplitLayoutContainerNode = Spread<
	{
		type: "split-layout-container";
		version: 1;
	},
	SerializedElementNode
>;

export class SplitLayoutContainerNode extends ElementNode {
	constructor(key?: NodeKey) {
		super(key);
	}

	static getType(): string {
		return "split-layout-container";
	}

	static clone(node: SplitLayoutContainerNode): SplitLayoutContainerNode {
		return new SplitLayoutContainerNode(node.__key);
	}

	createDOM(): HTMLElement {
		const dom = document.createElement("div");
		dom.classList.add(
			splitLayoutContainerStyles.SplitLayout__Container ||
				"SplitLayout__Container"
		);
		return dom;
	}

	updateDOM(): false {
		return false;
	}

	static importDOM(): DOMConversionMap | null {
		return {};
	}

	static importJSON(): SplitLayoutContainerNode {
		const node = $createSplitLayoutContainerNode();
		return node;
	}

	exportJSON(): SerializedSplitLayoutContainerNode {
		return {
			...super.exportJSON(),
			type: "split-layout-container",
			version: 1,
		};
	}

	setOpen(open: boolean): void {
		const writable = this.getWritable();
		writable.__open = open;
	}

	getOpen(): boolean {
		return this.__open;
	}

	toggleOpen(): void {
		this.setOpen(!this.getOpen());
	}

	isInline(): boolean {
		return false;
	}
}

export function $createSplitLayoutContainerNode(): SplitLayoutContainerNode {
	return new SplitLayoutContainerNode();
}

export function $isSplitLayoutContainerNode(
	node: LexicalNode | null | undefined
): node is SplitLayoutContainerNode {
	return node instanceof SplitLayoutContainerNode;
}
