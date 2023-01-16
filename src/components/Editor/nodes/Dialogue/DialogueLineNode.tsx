import dialogueStyles from "./Dialogue.module.css";

import type {
	DOMConversionMap,
	EditorConfig,
	LexicalNode,
	NodeKey,
	SerializedElementNode,
	Spread,
} from "lexical";
import { ElementNode } from "lexical";

type SerializedDialogueLineNode = Spread<
	{
		type: "dialogue-line";
		version: 1;
	},
	SerializedElementNode
>;

export class DialogueLineNode extends ElementNode {
	constructor(key?: NodeKey) {
		super(key);
	}

	static getType(): string {
		return "grammar-point-container";
	}

	static clone(node: DialogueLineNode): DialogueLineNode {
		return new DialogueLineNode(node.__key);
	}

	createDOM(_config: EditorConfig): HTMLElement {
		const dom = document.createElement("div");
		const domIcon = document.createElement("div");
		domIcon.classList.add(
			dialogueStyles.DialogueLine__Icon || "DialogueLine__Icon"
		);
		dom.classList.add(dialogueStyles.DialogueLine__ || "DialogueLine__");
		dom.appendChild(domIcon);
		return dom;
	}

	updateDOM(_prevNode: DialogueLineNode, _dom: HTMLDetailsElement): boolean {
		return false;
	}

	static importDOM(): DOMConversionMap | null {
		return {};
	}

	static importJSON(
		_serializedNode: SerializedDialogueLineNode
	): DialogueLineNode {
		const node = $createDialogueLineNode();
		return node;
	}

	exportJSON(): SerializedDialogueLineNode {
		return {
			...super.exportJSON(),
			type: "dialogue-line",
			version: 1,
		};
	}
}

export function $createDialogueLineNode(): DialogueLineNode {
	return new DialogueLineNode();
}

export function $isDialogueLineNode(
	node: LexicalNode | null | undefined
): node is DialogueLineNode {
	return node instanceof DialogueLineNode;
}
