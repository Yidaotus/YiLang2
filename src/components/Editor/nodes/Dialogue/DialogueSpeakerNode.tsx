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

type SerializedDialogueSpeakerNode = Spread<
	{
		type: "dialogue-speaker";
		version: 1;
	},
	SerializedElementNode
>;

export class DialogueSpeakerNode extends ElementNode {
	constructor(key?: NodeKey) {
		super(key);
	}

	static getType(): string {
		return "dialogue-speaker";
	}

	static clone(node: DialogueSpeakerNode): DialogueSpeakerNode {
		return new DialogueSpeakerNode(node.__key);
	}

	isInline(): boolean {
		return true;
	}

	createDOM(_config: EditorConfig): HTMLElement {
		const dom = document.createElement("div");
		dom.classList.add(dialogueStyles.Dialogue__Speaker || "Dialogue__Speaker");
		return dom;
	}

	updateDOM(_prevNode: DialogueSpeakerNode, _dom: HTMLDetailsElement): boolean {
		return false;
	}

	static importDOM(): DOMConversionMap | null {
		return {};
	}

	static importJSON(
		_serializedNode: SerializedDialogueSpeakerNode
	): DialogueSpeakerNode {
		const node = $createDialogueSpeakerNode();
		return node;
	}

	canIndent(): boolean {
		return false;
	}

	canBeEmpty(): boolean {
		return true;
	}

	exportJSON(): SerializedDialogueSpeakerNode {
		return {
			...super.exportJSON(),
			type: "dialogue-speaker",
			version: 1,
		};
	}
}

export function $createDialogueSpeakerNode(): DialogueSpeakerNode {
	return new DialogueSpeakerNode();
}

export function $isDialogueSpeakerNode(
	node: LexicalNode | null | undefined
): node is DialogueSpeakerNode {
	return node instanceof DialogueSpeakerNode;
}
