/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
	CLICK_COMMAND,
	COMMAND_PRIORITY_LOW,
	DecoratorNode,
	EditorConfig,
	LexicalNode,
	NodeKey,
	SerializedLexicalNode,
	SerializedTextNode,
	Spread,
} from "lexical";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";

import { TextNode } from "lexical";
import React, { useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { trpc } from "../../utils/trpc";

export type SerializedWordNode = Spread<
	{
		word: string;
		translation: string;
		id: string;
		type: "word";
	},
	SerializedLexicalNode
>;

type WordComponentProps = {
	word: string;
	translation: string;
	nodeKey: NodeKey;
	id: string;
};
const WordComponent = ({
	nodeKey,
	id,
	word,
	translation,
}: WordComponentProps) => {
	const [editor] = useLexicalComposerContext();
	const dbWord = trpc.dictionary.getWord.useQuery(id);
	const wordRef = useRef(null);
	const [isSelected, setSelected, clearSelected] =
		useLexicalNodeSelection(nodeKey);

	useEffect(() => {
		return editor.registerCommand<MouseEvent>(
			CLICK_COMMAND,
			(payload: MouseEvent) => {
				const event = payload;

				if (event.target === wordRef.current) {
					if (event.shiftKey) {
						setSelected(!isSelected);
					} else {
						clearSelected();
						setSelected(true);
					}
					return true;
				}

				return false;
			},
			COMMAND_PRIORITY_LOW
		);
	}, [clearSelected, editor, isSelected, setSelected]);

	console.debug();

	return (
		<>
			{dbWord.isError && <span>Error dbWord...</span>}
			{dbWord.isFetching && <progress className="progress w-12" />}
			{dbWord.isSuccess && !dbWord.data && (
				<div className="indicator">
					<span className="badge-error badge badge-xs indicator-item" />
					<div
						ref={wordRef}
						className={`mx-[2px] cursor-default rounded-sm ${
							isSelected ? "bg-primary" : "bg-slate-400"
						} px-[2px]`}
					>
						{isSelected ? translation : word}
					</div>
				</div>
			)}
			{dbWord.isSuccess && dbWord.data && (
				<div
					ref={wordRef}
					className={`mx-[2px] cursor-default rounded-sm ${
						isSelected ? "bg-primary" : "bg-slate-400"
					} px-[2px]`}
				>
					{isSelected ? dbWord.data.translation : dbWord.data.word}
				</div>
			)}
		</>
	);
};

export class WordNode extends DecoratorNode<React.ReactElement> {
	__word: string;
	__translation: string;
	__id: string;

	static getType(): string {
		return "word";
	}

	static clone(node: WordNode): WordNode {
		return new WordNode(node.__translation, node.__word, node.__id, node.__key);
	}

	constructor(translation: string, word: string, id: string, key?: NodeKey) {
		super(key);
		this.__translation = translation;
		this.__word = word;
		this.__id = id;
	}

	createDOM(config: EditorConfig): HTMLElement {
		const div = document.createElement("div");
		div.className = "inline-block";
		return div;
	}

	updateDOM(
		_prevNode: unknown,
		_dom: HTMLElement,
		_config: EditorConfig
	): boolean {
		return false;
	}

	getId(): string {
		const self = this.getLatest();
		return self.__id;
	}

	getTranslation(): string {
		const self = this.getLatest();
		return self.__translation;
	}

	getWord(): string {
		const self = this.getLatest();
		return self.__word;
	}

	exportJSON(): SerializedWordNode {
		return {
			word: this.getWord(),
			translation: this.getTranslation(),
			id: this.getId(),
			type: "word",
			version: 1,
		};
	}

	static importJSON(serializedNode: SerializedWordNode): WordNode {
		const node = $createWordNode(
			serializedNode.translation,
			serializedNode.word,
			serializedNode.id
		);
		return node;
	}

	decorate(): JSX.Element {
		return (
			<WordComponent
				nodeKey={this.__key}
				id={this.__id}
				word={this.__word}
				translation={this.__translation}
			/>
		);
	}

	getClassName(): string {
		const self = this.getLatest();
		return self.__className;
	}

	isInline(): boolean {
		return true;
	}
}

export function $isWordNode(
	node: LexicalNode | null | undefined
): node is WordNode {
	return node instanceof WordNode;
}

export function $createWordNode(
	translation: string,
	word: string,
	id: string
): WordNode {
	return new WordNode(translation, word, id);
}
