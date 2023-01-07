/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import imageParagraphStyles from "./ImageParagraph.module.scss";

import type {
	DOMConversionMap,
	EditorConfig,
	LexicalNode,
	NodeKey,
	SerializedElementNode,
	Spread,
} from "lexical";
import { ElementNode } from "lexical";

type SerializedImageParagraphContainerNode = Spread<
	{
		type: "image-paragraph-container";
		version: 1;
	},
	SerializedElementNode
>;

export class ImagePargraphContainerNode extends ElementNode {
	constructor(key?: NodeKey) {
		super(key);
	}

	static getType(): string {
		return "image-paragraph-container";
	}

	static clone(node: ImagePargraphContainerNode): ImagePargraphContainerNode {
		return new ImagePargraphContainerNode(node.__key);
	}

	createDOM(config: EditorConfig): HTMLElement {
		const dom = document.createElement("div");
		dom.classList.add(
			imageParagraphStyles.ImageParagraph__Container ||
				"ImageParagraph__Container"
		);
		return dom;
	}

	updateDOM(
		prevNode: ImagePargraphContainerNode,
		dom: HTMLDetailsElement
	): boolean {
		return false;
	}

	static importDOM(): DOMConversionMap | null {
		return {};
	}

	static importJSON(
		serializedNode: SerializedImageParagraphContainerNode
	): ImagePargraphContainerNode {
		const node = $createImagePargraphContainerNode();
		return node;
	}

	exportJSON(): SerializedImageParagraphContainerNode {
		return {
			...super.exportJSON(),
			type: "image-paragraph-container",
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

export function $createImagePargraphContainerNode(): ImagePargraphContainerNode {
	return new ImagePargraphContainerNode();
}

export function $isImagePargraphContainerNode(
	node: LexicalNode | null | undefined
): node is ImagePargraphContainerNode {
	return node instanceof ImagePargraphContainerNode;
}
