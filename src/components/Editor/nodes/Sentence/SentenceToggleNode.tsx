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

import type {
	EditorConfig,
	LexicalNode,
	SerializedLexicalNode,
	Spread,
} from "lexical";
import { CLICK_COMMAND, COMMAND_PRIORITY_LOW, DecoratorNode } from "lexical";

import { Box } from "@chakra-ui/react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import React, { useEffect, useRef } from "react";
import { IoLanguage } from "react-icons/io5";

export type SerializedSentenceToggleNode = Spread<
	{
		type: "sentence-toggle";
	},
	SerializedLexicalNode
>;

type SentenceToggleComponentProps = {
	nodeKey: string;
};
const SentenceToggleComponent = ({ nodeKey }: SentenceToggleComponentProps) => {
	const [editor] = useLexicalComposerContext();
	const [isSelected, setSelected, clearSelected] =
		useLexicalNodeSelection(nodeKey);
	const toggleRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		return editor.registerCommand<MouseEvent>(
			CLICK_COMMAND,
			(payload: MouseEvent) => {
				const currentRef = toggleRef.current;
				if (!currentRef) return false;

				const event = payload;
				const target = event.target as HTMLDivElement;

				if (target === currentRef || currentRef.contains(target)) {
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
		<Box
			w="1em"
			h="100%"
			ml="0.25em"
			mr="0.25em"
			borderRightRadius="4px"
			display="flex"
			justifyContent="center"
			alignItems="center"
			pos="relative"
			cursor="pointer"
			ref={toggleRef}
		>
			<IoLanguage width="100%" height="100%" />
		</Box>
	);
};

export class SentenceToggleNode extends DecoratorNode<React.ReactElement> {
	static getType(): string {
		return "sentence-toggle";
	}

	static clone(node: SentenceToggleNode): SentenceToggleNode {
		return new SentenceToggleNode(node.__key);
	}

	constructor(key?: string) {
		super(key);
	}

	createDOM(_config: EditorConfig): HTMLElement {
		const div = document.createElement("div");
		div.style.display = "inline-block";
		return div;
	}

	updateDOM(): false {
		return false;
	}

	exportJSON(): SerializedSentenceToggleNode {
		return {
			type: "sentence-toggle",
			version: 1,
		};
	}

	static importJSON(): SentenceToggleNode {
		const node = $createSentenceToggleNode();
		return node;
	}

	decorate(): JSX.Element {
		return <SentenceToggleComponent nodeKey={this.getKey()} />;
	}

	getClassName(): string {
		const self = this.getLatest();
		return self.__className;
	}

	isKeyboardSelectable(): boolean {
		return false;
	}

	isInline(): boolean {
		return true;
	}
}

export function $isSentenceToggleNode(
	node: LexicalNode | null | undefined
): node is SentenceToggleNode {
	return node instanceof SentenceToggleNode;
}

export function $createSentenceToggleNode(): SentenceToggleNode {
	return new SentenceToggleNode();
}
