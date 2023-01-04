/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
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

	createDOM(config: EditorConfig): HTMLElement {
		const dom = document.createElement("div");
		dom.classList.add(remarkStyles.Remark__Container || "Remark__Container");
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
		serializedNode: SerializedRemarkContainerNode
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
}

export function $createRemarkContainerNode(): RemarkContainerNode {
	return new RemarkContainerNode(true);
}

export function $isRemarkContainerNode(
	node: LexicalNode | null | undefined
): node is RemarkContainerNode {
	return node instanceof RemarkContainerNode;
}
