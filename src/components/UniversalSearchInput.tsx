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
	Stack,
	Text,
	useToken,
} from "@chakra-ui/react";
import useEditorSettingsStore from "@store/store";
import { trpc } from "@utils/trpc";
import { highlightString } from "@utils/utils";
import NextLink from "next/link";
import { useState } from "react";
import {
	IoAlbumsOutline,
	IoBookOutline,
	IoDocumentOutline,
	IoLanguageOutline,
	IoSearch,
} from "react-icons/io5";
import useDebounce from "./Editor/hooks/useDebounce";

type UniversalSearchInputProps = {
	width: string;
} & InputProps;
const UniversalSearchInput = ({
	width,
	...rest
}: UniversalSearchInputProps) => {
	const [hasInputFocus, setHasInputFocus] = useState(false);
	const [hasBodyFocus, setHasBodyFocus] = useState(false);
	const [iconColor, iconActive] = useToken("colors", ["text.300", "text.100"]);
	const activeLanguage = useEditorSettingsStore(
		(store) => store.selectedLanguage
	);

	const [searchInput, setSearchInput] = useState("");
	const searchString = useDebounce(searchInput);

	const searchEnabled = searchString.length > 0;
	const foundDocuments = trpc.document.search.useQuery(
		{ search: searchString, languageId: activeLanguage.id },
		{ enabled: searchEnabled, cacheTime: 1 }
	);
	const foundWords = trpc.dictionary.word.search.useQuery(
		{ search: searchString, languageId: activeLanguage.id },
		{ enabled: searchEnabled, cacheTime: 1 }
	);
	const foundGrammarPoints = trpc.dictionary.grammarPoint.search.useQuery(
		{ search: searchString, languageId: activeLanguage.id },
		{ enabled: searchEnabled, cacheTime: 1 }
	);
	const foundSentences = trpc.dictionary.sentence.search.useQuery(
		{ search: searchString, languageId: activeLanguage.id },
		{ enabled: searchEnabled, cacheTime: 1 }
	);

	const foundDocumentsLength = foundDocuments.data?.length || 0;
	const foundGrammarPointsLength = foundGrammarPoints.data?.length || 0;
	const foundSentencesLength = foundSentences.data?.length || 0;
	const foundWordsLength = foundWords.data?.length || 0;

	const isLoading =
		searchEnabled &&
		(foundDocuments.status === "loading" ||
			foundWords.status === "loading" ||
			foundSentences.status === "loading" ||
			foundGrammarPoints.status === "loading");

	const isOpen =
		(hasInputFocus || hasBodyFocus) &&
		foundDocumentsLength +
			foundGrammarPointsLength +
			foundWordsLength +
			foundSentencesLength >
			0;

	return (
		<Box>
			<Popover
				returnFocusOnClose={false}
				autoFocus={false}
				isOpen={isOpen}
				placement="bottom"
				closeOnBlur
				offset={[0, 0]}
			>
				<PopoverAnchor>
					<InputGroup w={width}>
						<Input
							focusBorderColor="none"
							value={searchInput}
							placeholder="Search..."
							onChange={(e) => setSearchInput(e.target.value)}
							onFocus={() => setHasInputFocus(true)}
							onBlur={() => setHasInputFocus(false)}
							borderBottomRadius={isOpen ? "0px" : "5px"}
							borderBottomColor={isOpen ? "#aaa7e6" : "text.100"}
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
					borderTopRadius="0px"
					borderTopColor="#aaa7e6"
				>
					<PopoverBody>
						<Stack
							overflow="hidden"
							whiteSpace="nowrap"
							textOverflow="ellipsis"
							spacing={3}
						>
							{foundDocuments.data && foundDocuments.data.length > 0 && (
								<Box>
									<Box>
										<Text
											textTransform="uppercase"
											color="text.300"
											fontSize="0.8rem"
											pb={1}
										>
											Documents
										</Text>
									</Box>
									<Box as="ul" display="flex" gap={1} flexDir="column">
										{foundDocuments.data.map((doc) => (
											<Box
												key={doc.id}
												display="flex"
												alignItems="center"
												as="li"
												pl={1}
											>
												<IoDocumentOutline color={iconColor} />
												<Link
													ml="auto"
													pl={2}
													as={NextLink}
													href={`/app/editor/${doc.id}`}
													fontSize="0.9em"
													w="200px"
													textOverflow="ellipsis"
													overflow="hidden"
													whiteSpace="nowrap"
												>
													{highlightString({
														input: doc.title,
														search: searchString,
													})}
												</Link>
											</Box>
										))}
									</Box>
								</Box>
							)}
							{foundGrammarPoints.data && foundGrammarPoints.data.length > 0 && (
								<Box>
									<Box>
										<Text
											textTransform="uppercase"
											color="text.300"
											fontSize="0.8rem"
											pb={1}
										>
											Grammar Points
										</Text>
									</Box>
									<Box as="ul" display="flex" gap={1} flexDir="column">
										{foundGrammarPoints.data.map((grammarPoint) => (
											<Box
												key={grammarPoint.id}
												display="flex"
												alignItems="center"
												pl={1}
												as="li"
											>
												<IoBookOutline color={iconColor} />
												<Link
													ml="auto"
													pl={2}
													as={NextLink}
													href={`/app/editor/${grammarPoint.sourceDocument.id}`}
													fontSize="0.9em"
													w="200px"
													textOverflow="ellipsis"
													overflow="hidden"
													whiteSpace="nowrap"
												>
													{highlightString({
														input: grammarPoint.title,
														search: searchString,
													})}
												</Link>
											</Box>
										))}
									</Box>
								</Box>
							)}
							{foundWords.data && foundWords.data.length > 0 && (
								<Box>
									<Box>
										<Text
											textTransform="uppercase"
											color="text.300"
											fontSize="0.8rem"
											pb={1}
										>
											Words
										</Text>
									</Box>
									<Box as="ul" display="flex" gap={1} flexDir="column">
										{foundWords.data.map((word) => (
											<Box
												key={word.id}
												display="flex"
												alignItems="center"
												as="li"
												pl={1}
											>
												<IoLanguageOutline color={iconColor} />
												<Link
													ml="auto"
													pl={2}
													as={NextLink}
													href={`/app/dictionary/${word.id}`}
													fontSize="0.9em"
													w="200px"
													textOverflow="ellipsis"
													overflow="hidden"
													whiteSpace="nowrap"
												>
													<Box
														color="text.500"
														w="200px"
														textOverflow="ellipsis"
														overflow="hidden"
														whiteSpace="nowrap"
													>
														{highlightString({
															input: word.word,
															search: searchString,
														})}
													</Box>
													<Box
														color="text.400"
														w="200px"
														textOverflow="ellipsis"
														overflow="hidden"
														whiteSpace="nowrap"
													>
														{highlightString({
															input: word.translation,
															search: searchString,
														})}
													</Box>
												</Link>
											</Box>
										))}
									</Box>
								</Box>
							)}
							{foundSentences.data && foundSentences.data.length > 0 && (
								<Box>
									<Box>
										<Text
											textTransform="uppercase"
											color="text.300"
											fontSize="0.8rem"
											pb={1}
										>
											Sentences
										</Text>
									</Box>
									<Box as="ul" display="flex" gap={1} flexDir="column">
										{foundSentences.data.map((sentence) => (
											<Box
												key={sentence.id}
												display="flex"
												alignItems="center"
												as="li"
												pl={1}
											>
												<IoAlbumsOutline color={iconColor} />
												<Link
													ml="auto"
													pl={2}
													as={NextLink}
													href={`/app/editor/${sentence.documentId}?highlight=${sentence.id}`}
													fontSize="0.9em"
													w="200px"
													textOverflow="ellipsis"
													overflow="hidden"
													whiteSpace="nowrap"
												>
													<Box
														color="text.500"
														w="200px"
														textOverflow="ellipsis"
														overflow="hidden"
														whiteSpace="nowrap"
													>
														{highlightString({
															input: sentence.sentence,
															search: searchString,
														})}
													</Box>
													<Box
														color="text.400"
														w="200px"
														textOverflow="ellipsis"
														overflow="hidden"
														whiteSpace="nowrap"
													>
														{highlightString({
															input: sentence.translation,
															search: searchString,
														})}
													</Box>
												</Link>
											</Box>
										))}
									</Box>
								</Box>
							)}
						</Stack>
					</PopoverBody>
				</PopoverContent>
			</Popover>
		</Box>
	);
};

export default UniversalSearchInput;
