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
	databaseId: string | null;
	word: string;
	spelling?: string;
	translations: Array<string>;
	tags: Array<string | Tag>;
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
import type { Tag } from "@prisma/client";
import useEditorSettingsStore from "@store/store";
import { trpc } from "@utils/trpc";
import React, { useEffect, useMemo, useRef } from "react";

export type SerializedWordNode = Spread<
	{
		word: string;
		translations: Array<string>;
		isAutoFill: boolean;
		databaseId: string | null;
		type: "word";
	},
	SerializedLexicalNode
>;

type WordComponentProps = {
	word: string;
	nodeKey: NodeKey;
	databaseId: string | null;
};
const WordComponent = ({
	nodeKey,
	databaseId: id,
	word,
}: WordComponentProps) => {
	const editorShowSpelling = useEditorSettingsStore(
		(state) => state.editorShowSpelling
	);
	const [editor] = useLexicalComposerContext();
	const dbWord = trpc.dictionary.word.get.useQuery(
		{ id: id || "" },
		{ enabled: !!id }
	);
	const wordRef = useRef<HTMLDivElement>(null);
	const [isSelected, setSelected, clearSelected] =
		useLexicalNodeSelection(nodeKey);

	const borderColors = useMemo(() => {
		if (!dbWord.data?.tags || dbWord.data.tags.length < 1) {
			return ["#9ca5bf"];
		} else {
			return dbWord.data.tags.map((t) => t.color);
		}
	}, [dbWord.data?.tags]);

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
						bg: isSelected ? "text.400" : "text.400",
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
							bg: isSelected ? "text.100" : "text.50",
							pos: "relative",
							"&::after": {
								content: '""',
								pos: "absolute",
								bottom: "0.2em",
								left: 0,
								width: "100%",
								h: "2px",
								bg: `linear-gradient(to right, ${borderColors
									.map(
										(t, i, tags) =>
											`${t} ${(i / tags.length) * 100}%, ${t} ${
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
	__databaseId: string | null;

	static getType(): string {
		return "word";
	}

	static clone(node: WordNode): WordNode {
		return new WordNode(
			node.__translations,
			node.__word,
			node.__databaseId,
			node.__key,
			node.__isAutoFill
		);
	}

	constructor(
		translations: Array<string>,
		word: string,
		databaseId: string | null,
		key?: NodeKey,
		isAutoFill?: boolean
	) {
		super(key);
		this.__translations = translations;
		this.__word = word;
		this.__databaseId = databaseId;
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

	setDatabaseId(id: string) {
		const self = this.getWritable();
		self.__databaseId = id;
	}
	getDatabaseId(): string | null {
		const self = this.getLatest();
		return self.__databaseId;
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
			databaseId: this.getDatabaseId(),
			isAutoFill: this.getIsAutoFill(),
			type: "word",
			version: 1,
		};
	}

	static importJSON(serializedNode: SerializedWordNode): WordNode {
		const node = $createWordNode(
			serializedNode.translations,
			serializedNode.word,
			serializedNode.databaseId,
			serializedNode.isAutoFill
		);
		return node;
	}

	decorate(): JSX.Element {
		return (
			<WordComponent
				nodeKey={this.__key}
				databaseId={this.__databaseId}
				word={this.__word}
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

	getTextContent(): string {
		const self = this.getLatest();
		return self.__word;
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
	databaseId: string | null,
	isAutoFill?: boolean
): WordNode {
	return new WordNode(translations, word, databaseId, undefined, isAutoFill);
}
