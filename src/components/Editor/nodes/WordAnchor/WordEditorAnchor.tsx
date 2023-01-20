/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import wordAnchorStyles from "./WordEditorAnchor.module.css";

import type {
	EditorConfig,
	LexicalNode,
	NodeKey,
	SerializedLexicalNode,
	Spread,
} from "lexical";
import { DecoratorNode } from "lexical";

import { Box, Text } from "@chakra-ui/react";
import React from "react";
import { IoLanguage } from "react-icons/io5";

export type SerializedWordNode = Spread<
	{
		word: string;
		type: "word-anchor";
	},
	SerializedLexicalNode
>;

type WordAnchorProps = {
	word: string;
};
const WordAnchorComponent = ({ word }: WordAnchorProps) => {
	return (
		<Box
			display="inline-flex"
			borderRadius="3px"
			bg="#f6f6f6"
			gap={2}
			border="1px solid #dbdbdb"
			mx={1}
			px={2}
			alignItems="center"
			pos="relative"
		>
			<Box as="span">
				<IoLanguage color="#7b52e8" size="1em" />
			</Box>

			<Text fontWeight="500" fontSize="0.9em" as="span">
				{word}
			</Text>
		</Box>
	);
};

export class WordAnchor extends DecoratorNode<React.ReactElement> {
	__word: string;

	static getType(): string {
		return "word-anchor";
	}

	static clone(node: WordAnchor): WordAnchor {
		return new WordAnchor(node.__word);
	}

	constructor(word: string, key?: NodeKey) {
		super(key);
		this.__word = word;
	}

	createDOM(_config: EditorConfig): HTMLElement {
		const div = document.createElement("div");
		div.classList.add(wordAnchorStyles.WordAnchorMarker || "WordAnchorMarker");
		return div;
	}

	updateDOM(): false {
		return false;
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
			type: "word-anchor",
			version: 1,
		};
	}

	static importJSON(serializedNode: SerializedWordNode): WordAnchor {
		const node = $createWordAnchorNode(serializedNode.word);
		return node;
	}

	decorate(): JSX.Element {
		return <WordAnchorComponent word={this.__word} />;
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

export function $isWordAnchorNode(
	node: LexicalNode | null | undefined
): node is WordAnchor {
	return node instanceof WordAnchor;
}

export function $createWordAnchorNode(word: string): WordAnchor {
	return new WordAnchor(word);
}
