/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import splitLayoutStyles from "./SplitLayoutContainer.module.scss";

import type {
	DOMConversionMap,
	EditorConfig,
	LexicalNode,
	NodeKey,
	SerializedElementNode,
	Spread,
} from "lexical";
import { ElementNode } from "lexical";

type SerializedSplitLayoutColumnNode = Spread<
	{
		type: "split-layout-column";
		version: 1;
	},
	SerializedElementNode
>;

export class SplitLayoutColumnNode extends ElementNode {
	constructor(key?: NodeKey) {
		super(key);
	}

	static getType(): string {
		return "split-layout-column";
	}

	static clone(node: SplitLayoutColumnNode): SplitLayoutColumnNode {
		return new SplitLayoutColumnNode(node.__key);
	}

	canBeEmpty(): false {
		return false;
	}

	createDOM(config: EditorConfig): HTMLElement {
		const dom = document.createElement("div");
		dom.classList.add(
			splitLayoutStyles.SplitLayout__Column || "SplitLayout__Column"
		);
		return dom;
	}

	updateDOM(prevNode: SplitLayoutColumnNode, dom: HTMLDetailsElement): boolean {
		return false;
	}

	static importDOM(): DOMConversionMap | null {
		return {};
	}

	isShadowRoot(): boolean {
		return true;
	}

	static importJSON(
		serializedNode: SerializedSplitLayoutColumnNode
	): SplitLayoutColumnNode {
		const node = $createSplitLayoutColumnNode();
		return node;
	}

	exportJSON(): SerializedSplitLayoutColumnNode {
		return {
			...super.exportJSON(),
			type: "split-layout-column",
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

export function $createSplitLayoutColumnNode(): SplitLayoutColumnNode {
	return new SplitLayoutColumnNode();
}

export function $isSplitLayoutColumnNode(
	node: LexicalNode | null | undefined
): node is SplitLayoutColumnNode {
	return node instanceof SplitLayoutColumnNode;
}
