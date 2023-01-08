/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import splitLayoutContainerStyles from "./SplitLayoutContainer.module.scss";

import type {
	DOMConversionMap,
	EditorConfig,
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

	createDOM(config: EditorConfig): HTMLElement {
		const dom = document.createElement("div");
		dom.classList.add(
			splitLayoutContainerStyles.SplitLayout__Container ||
				"SplitLayout__Container"
		);
		return dom;
	}

	updateDOM(
		prevNode: SplitLayoutContainerNode,
		dom: HTMLDetailsElement
	): boolean {
		return false;
	}

	static importDOM(): DOMConversionMap | null {
		return {};
	}

	static importJSON(
		serializedNode: SerializedSplitLayoutContainerNode
	): SplitLayoutContainerNode {
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
}

export function $createSplitLayoutContainerNode(): SplitLayoutContainerNode {
	return new SplitLayoutContainerNode();
}

export function $isSplitLayoutContainerNode(
	node: LexicalNode | null | undefined
): node is SplitLayoutContainerNode {
	return node instanceof SplitLayoutContainerNode;
}
