import type { InputProps } from "@chakra-ui/react";
import {
	Box,
	Input,
	InputGroup,
	InputRightElement,
	Link,
	Popover,
	PopoverAnchor,
	PopoverBody,
	PopoverContent,
	Spinner,
} from "@chakra-ui/react";
import useEditorStore from "@store/store";
import { trpc } from "@utils/trpc";
import NextLink from "next/link";
import { useState } from "react";
import {
	IoBookOutline,
	IoDocumentOutline,
	IoLanguageOutline,
	IoSearch,
} from "react-icons/io5";
import useDebounce from "./Editor/hooks/useDebounce";

const highlightString = ({
	input,
	search,
	highlightColor = "brand.100",
}: {
	input: string;
	search: string;
	highlightColor?: string;
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
			output.push(<span>{before}</span>);

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
		output.push(<span>{input.substring(processedLength, input.length)}</span>);
	}

	return output;
};

type UniversalSearchInputProps = {
	width: string;
} & InputProps;
const UniversalSearchInput = ({
	width,
	...rest
}: UniversalSearchInputProps) => {
	const [hasInputFocus, setHasInputFocus] = useState(false);
	const [hasBodyFocus, setHasBodyFocus] = useState(false);
	const activeLanguage = useEditorStore((store) => store.selectedLanguage);

	const [searchInput, setSearchInput] = useState("");
	const searchString = useDebounce(searchInput);

	const foundDocuments = trpc.document.search.useQuery(
		{ search: searchString, languageId: activeLanguage.id },
		{ enabled: searchString.length > 0, cacheTime: 1 }
	);
	const foundWords = trpc.dictionary.words.search.useQuery(
		{ search: searchString, languageId: activeLanguage.id },
		{ enabled: searchString.length > 0, cacheTime: 1 }
	);
	const foundGrammarPoints = trpc.dictionary.grammarPoint.search.useQuery(
		{ search: searchString, languageId: activeLanguage.id },
		{ enabled: searchString.length > 0, cacheTime: 1 }
	);

	const foundDocumentsLength = foundDocuments.data?.length || 0;
	const foundGrammarPointsLength = foundGrammarPoints.data?.length || 0;
	const foundWordsLength = foundWords.data?.length || 0;

	const isLoading =
		foundDocuments.isFetching ||
		foundWords.isFetching ||
		foundGrammarPoints.isFetching;

	const isOpen =
		(hasInputFocus || hasBodyFocus) &&
		foundDocumentsLength + foundGrammarPointsLength + foundWordsLength > 0;

	return (
		<>
			<Popover
				returnFocusOnClose={false}
				autoFocus={false}
				isOpen={isOpen}
				placement="bottom"
				closeOnBlur
			>
				<PopoverAnchor>
					<InputGroup w={width}>
						<Input
							value={searchInput}
							placeholder="Search..."
							onChange={(e) => setSearchInput(e.target.value)}
							onFocus={() => setHasInputFocus(true)}
							onBlur={() => setHasInputFocus(false)}
							{...rest}
						/>
						<InputRightElement>
							{isLoading ? (
								<Spinner size="sm" color="brand.500" />
							) : (
								<IoSearch />
							)}
						</InputRightElement>
					</InputGroup>
				</PopoverAnchor>
				<PopoverContent
					onFocus={() => setHasBodyFocus(true)}
					onBlur={() => setHasBodyFocus(false)}
					w={width}
				>
					<PopoverBody
						display="flex"
						flexDir="column"
						gap={2}
						sx={{
							"& > div:not(:last-child)": {
								borderBottomWidth: "1px",
								borderBottomColor: "text.100",
								pb: 2,
							},
						}}
					>
						{foundDocuments.data?.map((doc) => (
							<Box key={doc.id} display="flex" alignItems="center">
								<Link
									as={NextLink}
									href={`/app/editor/${doc.id}`}
									fontSize="0.9em"
								>
									{highlightString({ input: doc.title, search: searchString })}
								</Link>
								<Box ml="auto" pl={2}>
									<IoDocumentOutline />
								</Box>
							</Box>
						))}
						{foundGrammarPoints.data?.map((gp) => (
							<Box key={gp.id} display="flex" alignItems="center">
								<Link
									as={NextLink}
									href={`/app/editor/${gp.sourceDocument.id}`}
									fontSize="0.9em"
								>
									{highlightString({ input: gp.title, search: searchString })}
								</Link>
								<Box ml="auto" pl={2}>
									<IoBookOutline />
								</Box>
							</Box>
						))}
						{foundWords.data?.map((word) => (
							<Box key={word.id} display="flex" alignItems="center">
								<Link
									as={NextLink}
									href={`/app/dictionary/${word.id}`}
									fontSize="0.9em"
								>
									<Box color="text.500">
										{highlightString({
											input: word.word,
											search: searchString,
										})}
									</Box>
									<Box color="text.400">
										{highlightString({
											input: word.translation,
											search: searchString,
										})}
									</Box>
								</Link>
								<Box ml="auto" pl={2}>
									<IoLanguageOutline />
								</Box>
							</Box>
						))}
					</PopoverBody>
				</PopoverContent>
			</Popover>
		</>
	);
};

export default UniversalSearchInput;
