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

type SerializedDialogueSpeechNode = Spread<
	{
		type: "dialogue-speech";
		version: 1;
	},
	SerializedElementNode
>;

export class DialogueSpeechNode extends ElementNode {
	constructor(key?: NodeKey) {
		super(key);
	}

	static getType(): string {
		return "dialogue-speech";
	}

	static clone(node: DialogueSpeechNode): DialogueSpeechNode {
		return new DialogueSpeechNode(node.__key);
	}

	isInline(): boolean {
		return true;
	}

	createDOM(_config: EditorConfig): HTMLElement {
		const dom = document.createElement("div");
		dom.classList.add(dialogueStyles.Dialogue__Speech || "Dialogue__Speech");
		return dom;
	}

	updateDOM(_prevNode: DialogueSpeechNode, _dom: HTMLDetailsElement): boolean {
		return false;
	}

	static importDOM(): DOMConversionMap | null {
		return {};
	}

	canIndent(): boolean {
		return false;
	}

	canMergeWith(_node: ElementNode): boolean {
		return false;
	}

	canBeEmpty(): boolean {
		return true;
	}

	static importJSON(
		_serializedNode: SerializedDialogueSpeechNode
	): DialogueSpeechNode {
		const node = $createDialogueSpeechNode();
		return node;
	}

	exportJSON(): SerializedDialogueSpeechNode {
		return {
			...super.exportJSON(),
			type: "dialogue-speech",
			version: 1,
		};
	}
}

export function $createDialogueSpeechNode(): DialogueSpeechNode {
	return new DialogueSpeechNode();
}

export function $isDialogueSpeechNode(
	node: LexicalNode | null | undefined
): node is DialogueSpeechNode {
	return node instanceof DialogueSpeechNode;
}
