import type { ReferenceType } from "@floating-ui/react";
import type { Tag } from "@prisma/client";
import type { RouterTypes } from "@utils/trpc";
import type { GetServerSidePropsContext } from "next";
import type { ReactElement } from "react";

import {
	Box,
	ButtonGroup,
	Card,
	CardBody,
	CardHeader,
	IconButton,
	Input,
	InputGroup,
	InputRightElement,
	Link,
	Text,
	Textarea,
	useToken,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useCallback, useRef, useState } from "react";

import FloatingContainer from "@components/Editor/ui/FloatingContainer";
import Layout from "@components/Layout";
import useEditorStore from "@store/store";
import useOnClickOutside from "@ui/hooks/useOnClickOutside";
import protectPage from "@utils/protectPage";
import { trpc } from "@utils/trpc";
import { CreatableSelect } from "chakra-react-select";
import NextLink from "next/link";
import {
	IoChatbubbleEllipses,
	IoDocumentOutline,
	IoPricetagsOutline,
	IoSaveOutline,
} from "react-icons/io5";
import {
	RiAddLine,
	RiCloseLine,
	RiTranslate,
	RiTranslate2,
} from "react-icons/ri";
import { RxCalendar, RxPencil1, RxPlus } from "react-icons/rx";

type DataRowProps = {
	title: React.ReactNode;
	value: React.ReactNode;
};

const DataRow = ({ title, value }: DataRowProps) => (
	<Box
		display="flex"
		gap={[1, null, 8]}
		flexDirection={["column", null, "row"]}
	>
		<Box
			w={["100%", null, "30%"]}
			display="flex"
			alignItems={["flex-start", null, "flex-end"]}
			justifyContent="center"
			flexDir="column"
			color="text.300"
			gap="9px"
		>
			<Box>{title}</Box>
		</Box>
		<Box
			w={["100%", null, "70%"]}
			display="flex"
			alignItems="flex-start"
			justifyContent="center"
			flexDir="column"
			gap={2}
		>
			{value}
		</Box>
	</Box>
);

type TranslationsDataRowProps = {
	translations: Exclude<
		RouterTypes["dictionary"]["getWord"]["output"],
		null
	>["translations"];
	removeTranslation: (spellingToRemove: string) => void;
	addTranslation: (newSpelling: string) => void;
};
const TranslationsDataRow = ({
	translations,
	removeTranslation,
	addTranslation,
}: TranslationsDataRowProps) => {
	const [translationInput, setTranslationInput] = useState("");
	const [popupReference, setPopupReference] = useState<ReferenceType | null>(
		null
	);
	const floatingRef = useRef(null);
	const inputGroupRef = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);

	useOnClickOutside(inputGroupRef, () => {
		setPopupReference(null);
	});

	const addTranslationFromInput = useCallback(() => {
		addTranslation(translationInput);
		setTranslationInput("");
		setPopupReference(null);
	}, [addTranslation, translationInput]);

	const showInputPopup = useCallback(() => {
		setPopupReference(floatingRef.current);
		inputRef.current?.focus();
	}, []);

	const handleInputKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				addTranslationFromInput();
			}
		},
		[addTranslationFromInput]
	);

	return (
		<>
			<FloatingContainer
				popupPlacement="bottom"
				popupReference={popupReference}
				showArrow
			>
				<InputGroup
					size="md"
					width={["90%", null, "400px"]}
					ref={inputGroupRef}
				>
					<Input
						pr="4.5rem"
						size="md"
						autoFocus
						value={translationInput}
						onKeyDown={handleInputKeyDown}
						onChange={(e) => setTranslationInput(e.target.value)}
						ref={inputRef}
						border="none"
						focusBorderColor="none"
					/>
					<InputRightElement width="5.5rem">
						<Box borderLeftWidth="1px" borderColor="text.100" h="60%" />
						<ButtonGroup isAttached>
							<IconButton
								variant="ghost"
								colorScheme="brand"
								h="2.1rem"
								size="md"
								aria-label="Add Translation"
								icon={<IoSaveOutline />}
								onClick={addTranslationFromInput}
							/>
							<IconButton
								variant="ghost"
								colorScheme="brand"
								h="2.1rem"
								size="md"
								aria-label="Add Translation"
								icon={<RiCloseLine />}
								onClick={() => setPopupReference(null)}
							/>
						</ButtonGroup>
					</InputRightElement>
				</InputGroup>
			</FloatingContainer>
			<DataRow
				title={
					<Box display="flex" gap={1} alignItems="center">
						<RiTranslate />
						Translation
					</Box>
				}
				value={
					<Box display="flex" gap={2}>
						{translations.map((translation) => (
							<Box
								key={translation}
								bg="text.100"
								borderRadius="4px"
								color="text.500"
								display="flex"
								flexWrap="nowrap"
								alignItems="center"
								gap={1}
								pl={2}
							>
								<Text>{translation}</Text>
								<Box
									as="button"
									h="100%"
									borderRightRadius="4px"
									display="flex"
									alignItems="center"
									px={1}
									sx={{
										"& svg": {
											color: "text.400",
										},
										"&:hover": {
											"& svg": {
												color: "white",
											},
											bg: "#BD4C50",
										},
									}}
									onClick={() => removeTranslation(translation)}
								>
									<RiCloseLine />
								</Box>
							</Box>
						))}
						<Box
							bg="text.100"
							borderRadius="4px"
							color="text.500"
							display="flex"
							flexWrap="nowrap"
							alignItems="center"
							justifyContent="center"
							p={1}
							as="button"
							_hover={{
								bg: "text.200",
							}}
							onClick={showInputPopup}
							ref={floatingRef}
						>
							<RiAddLine />
						</Box>
					</Box>
				}
			/>
		</>
	);
};

type SpellingDataRowProps = {
	spelling: Exclude<
		RouterTypes["dictionary"]["getWord"]["output"],
		null
	>["spelling"];
	updateSpelling: (newSpelling: string) => void;
};
const SpellingDataRow = ({
	spelling,
	updateSpelling,
}: SpellingDataRowProps) => {
	const [isEditingSpelling, setIsEditingSpelling] = useState(false);
	const [spellingInput, setSpellingInput] = useState(spelling || "");

	const saveSpelling = useCallback(() => {
		setIsEditingSpelling(false);
		if (spellingInput && spelling !== spellingInput) {
			updateSpelling(spellingInput);
			//updateWord.mutate({ id: dbWord.data.id, spelling: spellingInput });
		}
	}, [spelling, spellingInput, updateSpelling]);

	return (
		<DataRow
			title={
				<Box display="flex" gap={1} alignItems="center">
					<RiTranslate2 />
					Spelling
				</Box>
			}
			value={
				isEditingSpelling ? (
					<InputGroup size="md" width={["90%", null, "400px"]}>
						<Input
							pr="4.5rem"
							size="md"
							value={spellingInput}
							onChange={(e) => setSpellingInput(e.target.value)}
							autoFocus
						/>
						<InputRightElement width="5.5rem">
							<Box borderLeftWidth="1px" borderColor="text.100" h="60%" />
							<ButtonGroup isAttached>
								<IconButton
									variant="ghost"
									colorScheme="brand"
									h="2.1rem"
									size="md"
									onClick={saveSpelling}
									aria-label="Add Translation"
									icon={<IoSaveOutline />}
								/>
								<IconButton
									variant="ghost"
									colorScheme="brand"
									h="2.1rem"
									size="md"
									onClick={() => setIsEditingSpelling(false)}
									aria-label="Add Translation"
									icon={<RiCloseLine />}
								/>
							</ButtonGroup>
						</InputRightElement>
					</InputGroup>
				) : (
					<Box color="text.400" display="flex" gap={2}>
						{spelling}

						<Box
							bg="text.100"
							borderRadius="4px"
							color="text.500"
							display="flex"
							flexWrap="nowrap"
							alignItems="center"
							justifyContent="center"
							px={2}
							py={1}
							as="button"
							_hover={{
								bg: "text.200",
							}}
							onClick={() => setIsEditingSpelling(true)}
						>
							<RxPencil1 />
						</Box>
					</Box>
				)
			}
		/>
	);
};

type TagDataRowProps = {
	languageId: string;
	tags: Exclude<RouterTypes["dictionary"]["getWord"]["output"], null>["tags"];
	linkNewTag: (tagId: string) => void;
	removeTag: (tagId: string) => void;
};
const TagDataRow = ({
	tags,
	linkNewTag,
	removeTag,
	languageId,
}: TagDataRowProps) => {
	const [popupReference, setPopupReference] = useState<ReferenceType | null>(
		null
	);
	const allTags = trpc.dictionary.getAllTags.useQuery({ language: languageId });
	const floatingRef = useRef(null);
	const inputRef = useRef(null);

	useOnClickOutside(inputRef, () => {
		setPopupReference(null);
	});

	const addTag = useCallback(
		(tag: Tag) => {
			linkNewTag(tag.id);
		},
		[linkNewTag]
	);

	const handleRemoveTag = useCallback(
		(tag: Tag) => {
			removeTag(tag.id);
		},
		[removeTag]
	);

	const showInputPopup = useCallback(() => {
		setPopupReference(floatingRef.current);
	}, []);

	return (
		<>
			<FloatingContainer
				popupPlacement="bottom"
				popupReference={popupReference}
				showArrow
			>
				<Box ref={inputRef}>
					<CreatableSelect
						size="md"
						focusBorderColor="none"
						value={[] as Tag[]}
						onChange={(newValue) => {
							setPopupReference(null);
							const newValueItem = newValue[0];
							if (newValueItem) {
								addTag(newValueItem);
							}
						}}
						chakraStyles={{
							container: (prev) => ({
								...prev,
								borderRadius: "5px",
								bg: "#fafaf9",
								w: "250px",
								_focus: {
									border: "none",
								},
							}),
							multiValue: (prev, state) => ({
								...prev,
								justifyContent: "center",
								alignItems: "center",
								borderColor: "text.100",
								bg: "#F5F5F5",
								borderWidth: "1px",
								"&::before": {
									content: '""',
									bg: state.data.color,
									h: "10px",
									w: "5px",
									pr: 2,
									mr: 2,
									borderRadius: "1em",
									border: `1px solid ${state.data.color}`,
								},
							}),
							indicatorSeparator: (prev) => ({
								...prev,
								borderLeft: "1px solid text.100",
								height: "60%",
							}),
							dropdownIndicator: (prev) => ({
								...prev,
								w: "10px",
								bg: "#FCFCFB",
							}),
							placeholder: (prev) => ({
								...prev,
								color: "text.200",
							}),
						}}
						placeholder="Tags"
						isMulti
						options={allTags.data || []}
						getOptionValue={(o) => o.name}
						getOptionLabel={(o) => o.name}
						components={{
							Option: ({ children, data, innerProps }) => (
								<Box
									as="div"
									sx={{
										color: "text.400",
										display: "flex",
										alignItems: "center",
										cursor: "pointer",
										py: 1,
										w: "100%",
										"&:hover": {
											bg: "#f4f4f4",
										},
									}}
									{...innerProps}
								>
									<Box
										sx={{
											w: "12px",
											h: "12px",
											ml: 1,
											mr: 2,
											borderRadius: "4px",
											border: `2px solid ${data.color}`,
											bg: data.color,
										}}
									/>
									{children}
								</Box>
							),
						}}
					/>
				</Box>
			</FloatingContainer>
			<DataRow
				title={
					<Box display="flex" gap={1} alignItems="center">
						<IoPricetagsOutline />
						Tags
					</Box>
				}
				value={
					<Box display="flex" gap={2} flexWrap="wrap">
						{tags.map((tag) => (
							<Box
								key={tag.id}
								bg={`${tag.color}55`}
								borderRadius="4px"
								color="text.500"
								display="flex"
								flexWrap="nowrap"
								alignItems="center"
								gap={1}
								pl={2}
							>
								<Text>{tag.name}</Text>
								<Box
									as="button"
									h="100%"
									borderRightRadius="4px"
									display="flex"
									alignItems="center"
									px={1}
									sx={{
										"& svg": {
											color: "text.400",
										},
										"&:hover": {
											"& svg": {
												color: "white",
											},
											bg: "#BD4C50",
										},
									}}
									onClick={() => handleRemoveTag(tag)}
								>
									<RiCloseLine />
								</Box>
							</Box>
						))}
						<Box
							bg="text.100"
							borderRadius="4px"
							color="text.500"
							display="flex"
							flexWrap="nowrap"
							alignItems="center"
							justifyContent="center"
							p={1}
							as="button"
							_hover={{
								bg: "text.200",
							}}
							ref={floatingRef}
							onClick={showInputPopup}
						>
							<RxPlus />
						</Box>
					</Box>
				}
			/>
		</>
	);
};

const filterUndefined = <T,>(v: T | undefined): v is T => {
	return v !== undefined;
};

const DictionaryEntryPag = () => {
	const router = useRouter();
	const { id: routerId } = router.query;
	const id = (Array.isArray(routerId) ? routerId[0] : routerId) || "";
	const selectedLanguage = useEditorStore((store) => store.selectedLanguage);
	const trpcUtils = trpc.useContext();
	const dbWord = trpc.dictionary.getWord.useQuery({ id });
	const updateWord = trpc.dictionary.updateWord.useMutation({
		onSuccess() {
			trpcUtils.dictionary.getWord.invalidate({ id });
		},
		onMutate(updatedWord) {
			const currentWord = trpcUtils.dictionary.getWord.getData({ id });

			if (currentWord) {
				trpcUtils.dictionary.getWord.cancel({ id });
				const allTags = trpcUtils.dictionary.getAllTags.getData({
					language: selectedLanguage.id,
				});
				trpcUtils.dictionary.getWord.setData(
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
			trpcUtils.dictionary.getWord.setData(context?.currentWord, { id });
		},
		onSettled: () => {
			trpcUtils.dictionary.getWord.invalidate({ id });
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
					<Box
						display="flex"
						justifyContent="center"
						alignItems="center"
						w="100%"
						pt={4}
					>
						{dbWord.data && (
							<Box display="flex" gap={[6, null, 3]} flexDir="column" w="100%">
								<DataRow
									title={<Box />}
									value={
										<Box fontSize="2.0em" color="brand.500">
											{dbWord.data?.word}
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
							</Box>
						)}
					</Box>
				</CardBody>
			</Card>
		</Box>
	);
};

DictionaryEntryPag.getLayout = function getLayout(page: ReactElement) {
	return <Layout>{page}</Layout>;
};

export const getServerSideProps = async (
	context: GetServerSidePropsContext
) => {
	return protectPage(context);
};

export default DictionaryEntryPag;
