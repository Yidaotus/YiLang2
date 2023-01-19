import { Box } from "@chakra-ui/react";
import type { LexicalNode } from "lexical";

export const filterUndefined = <T,>(v: T | undefined): v is T => {
	return v !== undefined;
};

export const filterNullish = <T,>(v: T | undefined | null): v is T => {
	return v !== undefined && v !== null;
};

export const highlightString = ({
	input,
	search,
	highlightColor = "brand.100",
	textColor = "text.400",
}: {
	input: string;
	search: string;
	highlightColor?: string;
	textColor?: string;
}) => {
	const re = new RegExp(search, "gi");
	const matches = input.matchAll(re);

	const output: Array<JSX.Element> = [];

	let processedLength = 0;
	let matchInput = input;

	for (const match of matches) {
		if (match && match.index !== undefined) {
			const subIndex = match.index - processedLength;
			const before = matchInput.substring(0, subIndex);
			output.push(
				<Box as="span" color={textColor}>
					{before}
				</Box>
			);

			const firstMatch = match[0];
			if (!firstMatch) continue;

			const foundSubstring = matchInput.substring(
				subIndex,
				subIndex + firstMatch.length
			);
			output.push(
				<Box as="span" color={highlightColor}>
					{foundSubstring}
				</Box>
			);

			processedLength += before.length + foundSubstring.length;

			const after = matchInput.substring(
				subIndex + firstMatch.length,
				matchInput.length
			);
			matchInput = after;
		}
	}

	if (processedLength < input.length) {
		output.push(
			<Box as="span" color={textColor}>
				{input.substring(processedLength, input.length)}
			</Box>
		);
	}

	return output;
};

export function $getAncestor(
	node: LexicalNode,
	predicate: (ancestor: LexicalNode) => boolean
): null | LexicalNode {
	let parent: null | LexicalNode = node;
	while (
		parent !== null &&
		(parent = parent.getParent()) !== null &&
		!predicate(parent)
	);
	return parent;
}
