/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export type EditorTag = {
	id?: string;
	name: string;
	color: string;
};

export type EditorWord = {
	id?: string;
	word: string;
	spelling?: string;
	translations: Array<string>;
	tags: Array<string>;
	comment?: string;
	documentId?: string;
};

import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import type {
	EditorConfig,
	LexicalNode,
	NodeKey,
	SerializedLexicalNode,
	Spread,
} from "lexical";
import {
	$getNodeByKey,
	CLICK_COMMAND,
	COMMAND_PRIORITY_LOW,
	DecoratorNode,
} from "lexical";

import { Box } from "@chakra-ui/react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import useEditorStore from "@store/store";
import { trpc } from "@utils/trpc";
import React, { useEffect, useRef } from "react";

export type SerializedWordNode = Spread<
	{
		word: string;
		translations: Array<string>;
		isAutoFill: boolean;
		id?: string;
		type: "word";
	},
	SerializedLexicalNode
>;

type WordComponentProps = {
	word: string;
	nodeKey: NodeKey;
	id?: string;
};
const WordComponent = ({ nodeKey, id, word }: WordComponentProps) => {
	const editorShowSpelling = useEditorStore(
		(state) => state.editorShowSpelling
	);
	const [editor] = useLexicalComposerContext();
	const dbWord = trpc.dictionary.getWord.useQuery(
		{ id: id || "" },
		{ enabled: !!id }
	);
	const wordRef = useRef<HTMLDivElement>(null);
	const [isSelected, setSelected, clearSelected] =
		useLexicalNodeSelection(nodeKey);

	useEffect(() => {
		const remoteWord = dbWord.data;
		if (remoteWord) {
			editor.update(() => {
				const node = $getNodeByKey(nodeKey);
				if (!node || !$isWordNode(node)) return;

				if (node.getWord() !== remoteWord.word) {
					node.setWord(remoteWord.word);
				}
				if (node.getTranslations() !== remoteWord.translations) {
					node.setTranslation(remoteWord.translations);
				}
			});
		}
	}, [dbWord.data, editor, nodeKey]);

	useEffect(() => {
		return editor.registerCommand<MouseEvent>(
			CLICK_COMMAND,
			(payload: MouseEvent) => {
				const event = payload;

				const currentWordRef = wordRef.current;
				if (
					currentWordRef &&
					(event.target === currentWordRef ||
						currentWordRef.contains(event.target as HTMLElement))
				) {
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

	return (
		<>
			{!dbWord.data && (
				<Box
					ref={wordRef}
					sx={{
						mx: "2px",
						cursor: "default",
						borderRadius: "4px",
						px: "2px",
						bg: isSelected ? "#CCCCCC" : "#FAFAF9",
						borderBottom: "5px",
					}}
				>
					{word}
				</Box>
			)}
			{dbWord.data && (
				<Box pos="relative" whiteSpace="normal" cursor="pointer">
					<Box
						ref={wordRef}
						sx={{
							mx: "2px",
							borderRadius: "4px",
							px: "2px",
							bg: isSelected ? "text.100" : "#FAFAF9",
							pos: "relative",
							"&::after": {
								content: '""',
								pos: "absolute",
								bottom: "0.2em",
								left: 0,
								width: "100%",
								h: "2px",
								bg: `linear-gradient(to right, ${dbWord.data.tags
									.map(
										(t, i, tags) =>
											`${t.color} ${(i / tags.length) * 100}%, ${t.color} ${
												((i + 1) / tags.length) * 100
											}%`
									)
									.join(",")})`,
							},
						}}
					>
						<>
							{editorShowSpelling && !!dbWord.data.spelling && (
								<span>
									<ruby>
										{dbWord.data.word} <rp>(</rp>
										<rt>{dbWord.data.spelling}</rt>
										<rp>)</rp>
									</ruby>
								</span>
							)}
							{(!editorShowSpelling || !dbWord.data.spelling) && (
								<span>{dbWord.data.word}</span>
							)}
						</>
					</Box>
				</Box>
			)}
		</>
	);
};

export class WordNode extends DecoratorNode<React.ReactElement> {
	__word: string;
	__translations: Array<string>;
	__isAutoFill: boolean;
	__id?: string;

	static getType(): string {
		return "word";
	}

	static clone(node: WordNode): WordNode {
		return new WordNode(
			node.__translations,
			node.__word,
			node.__id,
			node.__key,
			node.__isAutoFill
		);
	}

	constructor(
		translations: Array<string>,
		word: string,
		id?: string,
		key?: NodeKey,
		isAutoFill?: boolean
	) {
		super(key);
		this.__translations = translations;
		this.__word = word;
		this.__id = id;
		this.__isAutoFill = isAutoFill || false;
	}

	createDOM(_config: EditorConfig): HTMLElement {
		const div = document.createElement("div");
		div.style.display = "inline-block";
		return div;
	}

	updateDOM(): false {
		return false;
	}

	setIsAutoFill(isAutoFill: boolean) {
		const self = this.getWritable();
		self.__isAutoFill = isAutoFill;
	}
	getIsAutoFill(): boolean {
		const self = this.getLatest();
		return self.__isAutoFill;
	}

	setId(id: string) {
		const self = this.getWritable();
		self.__id = id;
	}
	getId(): string | undefined {
		const self = this.getLatest();
		return self.__id;
	}

	setTranslation(translations: Array<string>) {
		const self = this.getWritable();
		self.__translations = translations;
	}
	getTranslations(): Array<string> {
		const self = this.getLatest();
		return self.__translations;
	}

	setWord(word: string) {
		const self = this.getWritable();
		self.__word = word;
	}
	getWord(): string {
		const self = this.getLatest();
		return self.__word;
	}

	exportJSON(): SerializedWordNode {
		return {
			word: this.getWord(),
			translations: this.getTranslations(),
			id: this.getId(),
			isAutoFill: this.getIsAutoFill(),
			type: "word",
			version: 1,
		};
	}

	static importJSON(serializedNode: SerializedWordNode): WordNode {
		const node = $createWordNode(
			serializedNode.translations,
			serializedNode.word,
			serializedNode.id,
			serializedNode.isAutoFill
		);
		return node;
	}

	decorate(): JSX.Element {
		return (
			<WordComponent nodeKey={this.__key} id={this.__id} word={this.__word} />
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
	translations: Array<string>,
	word: string,
	id?: string,
	isAutoFill?: boolean
): WordNode {
	return new WordNode(translations, word, id, undefined, isAutoFill);
}
