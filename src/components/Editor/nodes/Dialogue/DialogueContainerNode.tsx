import dialogueStyls from "./Dialogue.module.css";

import type {
	DOMConversionMap,
	EditorConfig,
	LexicalNode,
	NodeKey,
	SerializedElementNode,
	Spread,
} from "lexical";
import { ElementNode } from "lexical";

type SerializedDialogueContainerNode = Spread<
	{
		type: "dialogue";
		version: 1;
	},
	SerializedElementNode
>;

export class DialogueContainerNode extends ElementNode {
	constructor(key?: NodeKey) {
		super(key);
	}

	static getType(): string {
		return "dialogue";
	}

	static clone(node: DialogueContainerNode): DialogueContainerNode {
		return new DialogueContainerNode(node.__key);
	}

	createDOM(_config: EditorConfig): HTMLElement {
		const dom = document.createElement("div");
		dom.classList.add(
			dialogueStyls.Dialogue__Container || "Dialogue__Container"
		);
		return dom;
	}

	updateDOM(
		_prevNode: DialogueContainerNode,
		_dom: HTMLDetailsElement
	): boolean {
		return false;
	}

	static importDOM(): DOMConversionMap | null {
		return {};
	}

	static importJSON(
		_serializedNode: SerializedDialogueContainerNode
	): DialogueContainerNode {
		const node = $createDialogueContainerNode();
		return node;
	}

	exportJSON(): SerializedDialogueContainerNode {
		return {
			...super.exportJSON(),
			type: "dialogue",
			version: 1,
		};
	}

	canMergeWith(node: ElementNode): boolean {
		return $isDialogueContainerNode(node);
	}

	canBeEmpty(): boolean {
		return false;
	}
}

export function $createDialogueContainerNode(): DialogueContainerNode {
	return new DialogueContainerNode();
}

export function $isDialogueContainerNode(
	node: LexicalNode | null | undefined
): node is DialogueContainerNode {
	return node instanceof DialogueContainerNode;
}
