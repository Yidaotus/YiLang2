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

import type {
	EditorConfig,
	LexicalNode,
	NodeKey,
	SerializedLexicalNode,
	Spread,
} from "lexical";
import { $getNodeByKey } from "lexical";
import { CLICK_COMMAND, COMMAND_PRIORITY_LOW, DecoratorNode } from "lexical";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";

import React, { useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { trpc } from "@utils/trpc";
import { Box } from "@chakra-ui/react";
import useEditorStore from "@store/store";

export type SerializedWordNode = Spread<
	{
		word: string;
		translations: Array<string>;
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
	const selectedLanguage = useEditorStore((state) => state.selectedLanguage);
	const dbWord = trpc.dictionary.getWord.useQuery(
		{ id: id || "" },
		{ enabled: !!id }
	);
	const wordRef = useRef(null);
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
											`${t.tag.color} ${(i / tags.length) * 100}%, ${
												t.tag.color
											} ${((i + 1) / tags.length) * 100}%`
									)
									.join(",")})`,
							},
						}}
					>
						{dbWord.data.word}
					</Box>
					{editorShowSpelling && !!dbWord.data.spelling && (
						<Box
							pos="absolute"
							top="-1.5em"
							fontSize="0.7em"
							userSelect="none"
							width="100%"
							display="flex"
							justifyContent="center"
							overflow="visible"
							whiteSpace="nowrap"
							pointerEvents="none"
						>
							{dbWord.data.spelling}
						</Box>
					)}
				</Box>
			)}
		</>
	);
};

export class WordNode extends DecoratorNode<React.ReactElement> {
	__word: string;
	__translations: Array<string>;
	__id?: string;

	static getType(): string {
		return "word";
	}

	static clone(node: WordNode): WordNode {
		return new WordNode(
			node.__translations,
			node.__word,
			node.__id,
			node.__key
		);
	}

	constructor(
		translations: Array<string>,
		word: string,
		id?: string,
		key?: NodeKey
	) {
		super(key);
		this.__translations = translations;
		this.__word = word;
		this.__id = id;
	}

	createDOM(config: EditorConfig): HTMLElement {
		const div = document.createElement("div");
		div.style.display = "inline-block";
		return div;
	}

	updateDOM(
		_prevNode: unknown,
		_dom: HTMLElement,
		_config: EditorConfig
	): boolean {
		return false;
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
			type: "word",
			version: 1,
		};
	}

	static importJSON(serializedNode: SerializedWordNode): WordNode {
		const node = $createWordNode(
			serializedNode.translations,
			serializedNode.word,
			serializedNode.id
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
	id?: string
): WordNode {
	return new WordNode(translations, word, id);
}
