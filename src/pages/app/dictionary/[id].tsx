import type { GetServerSidePropsContext } from "next";
import type { ReactElement } from "react";

import {
	Box,
	Card,
	CardBody,
	CardHeader,
	Link,
	Stack,
	Text,
	Textarea,
	useToken,
} from "@chakra-ui/react";
import DataRow from "@components/Dictionary/DataRow";
import SpellingDataRow from "@components/Dictionary/SpellingDataRow";
import TagDataRow from "@components/Dictionary/TagDataRow";
import TranslationsDataRow from "@components/Dictionary/TranslationsDataRow";
import Layout from "@components/Layout";
import useEditorSettingsStore from "@store/store";
import protectPage from "@utils/protectPage";
import type { RouterTypes } from "@utils/trpc";
import { trpc } from "@utils/trpc";
import { filterUndefined, highlightString } from "@utils/utils";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useCallback } from "react";
import {
	IoAlbumsOutline,
	IoChatbubbleEllipses,
	IoDocumentOutline,
	IoSwapVertical,
} from "react-icons/io5";
import { RiTranslate } from "react-icons/ri";
import { RxCalendar } from "react-icons/rx";

const DictionaryEntryPage = () => {
	const router = useRouter();
	const { id: routerId } = router.query;
	const id = (Array.isArray(routerId) ? routerId[0] : routerId) || "";
	const selectedLanguage = useEditorSettingsStore(
		(store) => store.selectedLanguage
	);
	const trpcUtils = trpc.useContext();
	const dbWord = trpc.dictionary.word.get.useQuery({ id });
	const relatedSentences = trpc.dictionary.sentence.getForWord.useQuery(
		{ wordId: dbWord.data?.id || "" },
		{
			enabled: !!dbWord.data?.id,
		}
	);

	const updateWord = trpc.dictionary.word.update.useMutation({
		onSuccess() {
			trpcUtils.dictionary.word.get.invalidate({ id });
		},
		onMutate(updatedWord) {
			const currentWord = trpcUtils.dictionary.word.get.getData({ id });

			if (currentWord) {
				trpcUtils.dictionary.word.get.cancel({ id });
				const allTags = trpcUtils.dictionary.tag.getAll.getData({
					language: selectedLanguage.id,
				});
				trpcUtils.dictionary.word.get.setData(
					{
						...currentWord,
						translations: updatedWord.translations || currentWord.translations,
						spelling: updatedWord.spelling || currentWord.spelling,
						tags:
							updatedWord.tags
								?.map((t) =>
									typeof t === "string"
										? allTags?.find((tag) => tag.id === t)
										: undefined
								)
								.filter(filterUndefined) || currentWord.tags,
					},
					{ id }
				);

				return { currentWord };
			}
		},
		onError: (err, newTodo, context) => {
			trpcUtils.dictionary.word.get.setData(context?.currentWord, { id });
		},
		onSettled: () => {
			trpcUtils.dictionary.word.get.invalidate({ id });
		},
	});

	const addTranslation = useCallback(
		(newTranslation: string) => {
			if (dbWord.data) {
				updateWord.mutate({
					id: dbWord.data.id,
					translations: [...dbWord.data.translations, newTranslation],
					language: selectedLanguage.id,
				});
			}
		},
		[dbWord.data, selectedLanguage.id, updateWord]
	);

	const removeTranslation = useCallback(
		(translation: string) => {
			if (dbWord.data) {
				updateWord.mutate({
					id: dbWord.data.id,
					translations: dbWord.data.translations.filter(
						(t) => t !== translation
					),
					language: selectedLanguage.id,
				});
			}
		},
		[dbWord, selectedLanguage.id, updateWord]
	);

	const [text400, brand500] = useToken("colors", ["text.400", "brand.500"]);

	const updateSpelling = useCallback(
		(newSpelling: string) => {
			if (dbWord.data?.id) {
				updateWord.mutate({
					id: dbWord.data.id,
					spelling: newSpelling,
					language: selectedLanguage.id,
				});
			}
		},
		[dbWord, selectedLanguage.id, updateWord]
	);

	const linkNewTag = useCallback(
		(tagId: string) => {
			if (dbWord.data?.id) {
				updateWord.mutate({
					id: dbWord.data.id,
					tags: [...dbWord.data.tags.map((t) => t.id), tagId],
					language: selectedLanguage.id,
				});
			}
		},
		[dbWord, selectedLanguage.id, updateWord]
	);

	const removeTag = useCallback(
		(tagId: string) => {
			if (dbWord.data?.id) {
				updateWord.mutate({
					id: dbWord.data.id,
					tags: dbWord.data.tags.map((t) => t.id).filter((t) => t !== tagId),
					language: selectedLanguage.id,
				});
			}
		},
		[dbWord, selectedLanguage.id, updateWord]
	);

	const highlightWordInSentence = useCallback(
		({
			sentence,
			words,
		}: {
			sentence: Exclude<
				RouterTypes["dictionary"]["sentence"]["getForWord"]["output"],
				null
			>[number];
			words: Array<{ id: string; word: string }>;
		}) => {
			//which word fits the sentecen
			const targetWord = words.find((word) =>
				sentence.words.map((w) => w.id).includes(word.id)
			);

			return highlightString({
				input: sentence.sentence,
				search: targetWord?.word || "",
				textColor: "text.400",
				highlightColor: "#8785e0",
			});
		},
		[]
	);

	return (
		<Box
			px={[6, 8, 25]}
			pt="12"
			pb={2}
			maxH="100vh"
			overflow="auto"
			pos="relative"
			display="flex"
			w="100%"
			justifyContent="center"
			alignItems="center"
			flexDir="column"
		>
			<Card maxW="1000px" w="100%">
				<CardHeader>
					<Box display="flex" gap={5} pos="sticky" top="0" bg="white" pt={4}>
						<Box pb={4} display="flex" gap={4} alignItems="center" zIndex={50}>
							<RiTranslate size="2em" color={brand500} />
							<Text as="h1" fontSize="2em" color="brand.500">
								Dictionary
							</Text>
						</Box>
					</Box>
				</CardHeader>
				<CardBody>
					{dbWord.data && (
						<Box
							display="flex"
							justifyContent="center"
							alignItems="center"
							w="100%"
						>
							{dbWord.data && (
								<Box
									display="flex"
									gap={[6, null, 3]}
									flexDir="column"
									w="100%"
								>
									<DataRow
										title={<Box />}
										value={
											<Box fontSize="2.0em" color="brand.500">
												{dbWord.data.word}
											</Box>
										}
									/>
									<SpellingDataRow
										spelling={dbWord.data.spelling}
										updateSpelling={updateSpelling}
									/>
									<TranslationsDataRow
										translations={dbWord.data.translations}
										addTranslation={addTranslation}
										removeTranslation={removeTranslation}
									/>
									<TagDataRow
										languageId={selectedLanguage.id}
										tags={dbWord.data.tags}
										linkNewTag={linkNewTag}
										removeTag={removeTag}
									/>
									<DataRow
										title={
											<Box display="flex" gap={1} alignItems="center">
												<RxCalendar />
												Created at
											</Box>
										}
										value={
											<Box color="text.400">
												{dbWord.data.createdAt.toLocaleDateString()}
											</Box>
										}
									/>
									<DataRow
										title={
											<Box display="flex" gap={1} alignItems="center">
												<IoDocumentOutline />
												Source Document
											</Box>
										}
										value={
											<Link
												as={NextLink}
												href={`/app/editor/${dbWord.data?.sourceDocument?.id}?highlight=${dbWord.data?.id}`}
											>
												<Text textDecoration="underline" color="text.400">
													{dbWord.data.sourceDocument?.title}
												</Text>
											</Link>
										}
									/>
									<DataRow
										title={
											<Box display="flex" gap={1} alignItems="center">
												<IoChatbubbleEllipses />
												Comment
											</Box>
										}
										value={
											<Textarea
												color="text.400"
												maxW="500px"
												readOnly
												zIndex={-1}
												value={dbWord.data.comment || ""}
											/>
										}
									/>
									{relatedSentences.data && (
										<DataRow
											alignTop
											title={
												<Box display="flex" gap={1} alignItems="center">
													<IoAlbumsOutline />
													Sentences
												</Box>
											}
											value={
												<Stack>
													{relatedSentences.data.map((sentence) => (
														<Box key={sentence.id}>
															<Box>
																<Link
																	as={NextLink}
																	href={`/app/editor/${sentence.documentId}?highlight=${sentence.id}`}
																>
																	{dbWord.data
																		? highlightWordInSentence({
																				sentence,
																				words: [
																					dbWord.data,
																					...(dbWord.data?.variations || []),
																				],
																		  })
																		: sentence.sentence}
																</Link>
															</Box>
															<Box>
																<Text
																	color="text.300"
																	fontSize="0.9em"
																	fontStyle="italic"
																>
																	{sentence.translation}
																</Text>
															</Box>
														</Box>
													))}
												</Stack>
											}
										/>
									)}
									<DataRow
										alignTop
										title={
											<Box display="flex" gap={1} alignItems="center">
												<IoSwapVertical />
												Variations
											</Box>
										}
										value={
											<Stack w="100%">
												{dbWord.data?.variations.map((variation) => (
													<Box
														display="flex"
														flexDirection="row"
														key={variation.id}
														justifyContent="space-between"
													>
														<Text color="text.400" fontSize="1.2em">
															{variation.word}
														</Text>
														<Box
															display="flex"
															pl={6}
															gap={1}
															alignItems="center"
														>
															{variation.tags.map((t) => (
																<Box
																	key={t.id}
																	bg={t.color}
																	borderRadius="2px"
																	px={1}
																>
																	<Text fontSize="0.8rem" color="white">
																		{t.name}
																	</Text>
																</Box>
															))}
														</Box>
													</Box>
												))}
											</Stack>
										}
									/>
									{/* <DataRow
										alignTop
										title={
											<Box display="flex" gap={1} alignItems="center">
												<IoAlbumsOutline />
												Related To
											</Box>
										}
										value={
											<Stack>
												{dbWord.data.relatedTo.map((word) => (
													<Box key={word.id}>
														<Box>
															<Link
																as={NextLink}
																href={`/app/dictionary/${word.id}`}
															>
																{word.word}
															</Link>
														</Box>
													</Box>
												))}
											</Stack>
										}
									/>
									<DataRow
										alignTop
										title={
											<Box display="flex" gap={1} alignItems="center">
												<IoAlbumsOutline />
												Related By
											</Box>
										}
										value={
											<Stack>
												{dbWord.data.relatedBy.map((word) => (
													<Box key={word.id}>
														<Box>
															<Link
																as={NextLink}
																href={`/app/dictionary/${word.id}`}
															>
																{word.word}
															</Link>
														</Box>
													</Box>
												))}
											</Stack>
										}
									/> */}
								</Box>
							)}
						</Box>
					)}
					{!dbWord.data && <Box>No Word Found!</Box>}
				</CardBody>
			</Card>
		</Box>
	);
};

DictionaryEntryPage.getLayout = function getLayout(page: ReactElement) {
	return <Layout>{page}</Layout>;
};

export const getServerSideProps = async (
	context: GetServerSidePropsContext
) => {
	return protectPage(context);
};

export default DictionaryEntryPage;
