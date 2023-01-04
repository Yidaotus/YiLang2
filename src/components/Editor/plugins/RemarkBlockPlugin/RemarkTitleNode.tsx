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
	LexicalEditor,
	LexicalNode,
	RangeSelection,
	SerializedElementNode,
	Spread,
} from "lexical";
import { $createParagraphNode, $isElementNode, ElementNode } from "lexical";

import { $isRemarkContainerNode } from "./RemarkContainerNode";
import { $isRemarkContentNode } from "./RemarkContentNode";

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

	createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
		const dom = document.createElement("div");
		dom.classList.add(remarkStyles.Remark__Title || "Remark__Title");
		return dom;
	}

	updateDOM(prevNode: RemarkTitleNode, dom: HTMLElement): boolean {
		return false;
	}

	static importDOM(): DOMConversionMap | null {
		return {};
	}

	static importJSON(
		serializedNode: SerializedRemarkTitleNode
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

	insertNewAfter(_: RangeSelection, restoreSelection = true): ElementNode {
		const containerNode = this.getParentOrThrow();

		if (!$isRemarkContainerNode(containerNode)) {
			throw new Error(
				"CollapsibleTitleNode expects to be child of CollapsibleContainerNode"
			);
		}

		if (containerNode.getOpen()) {
			const contentNode = this.getNextSibling();
			if (!$isRemarkContentNode(contentNode)) {
				throw new Error(
					"CollapsibleTitleNode expects to have CollapsibleContentNode sibling"
				);
			}

			const firstChild = contentNode.getFirstChild();
			if ($isElementNode(firstChild)) {
				return firstChild;
			} else {
				const paragraph = $createParagraphNode();
				contentNode.append(paragraph);
				return paragraph;
			}
		} else {
			const paragraph = $createParagraphNode();
			containerNode.insertAfter(paragraph, restoreSelection);
			return paragraph;
		}
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
