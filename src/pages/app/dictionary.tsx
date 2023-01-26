import type { NextPageWithLayout } from "pages/_app";
import type { ReactElement } from "react";
import { useCallback, useMemo, useState } from "react";

import {
	Box,
	ButtonGroup,
	Card,
	CardBody,
	CardHeader,
	CircularProgress,
	IconButton,
	Input,
	InputGroup,
	InputLeftElement,
	InputRightElement,
	Link,
	Skeleton,
	Table,
	TableContainer,
	Tbody,
	Td,
	Text,
	Th,
	Thead,
	Tr,
	useToken,
} from "@chakra-ui/react";
import Layout from "@components/Layout";
import useEditorSettingsStore from "@store/store";
import protectPage from "@utils/protectPage";
import type { GetServerSidePropsContext } from "next";
import NextLink from "next/link";
import {
	IoArrowBack,
	IoArrowDown,
	IoArrowForward,
	IoArrowUp,
	IoClose,
	IoFilter,
	IoSearch,
	IoSwapVertical,
	IoTrashBin,
} from "react-icons/io5";
import { RiTranslate } from "react-icons/ri";
import { trpc } from "../../utils/trpc";

const DictionaryPage: NextPageWithLayout = () => {
	const [text400, brand500] = useToken("colors", ["text.400", "brand.500"]);
	const selectedLanguage = useEditorSettingsStore(
		(state) => state.selectedLanguage
	);
	const allWords = trpc.dictionary.word.getAll.useQuery({
		language: selectedLanguage.id,
	});
	const trcpUtils = trpc.useContext();
	const removeWord = trpc.dictionary.word.delete.useMutation({
		onSuccess: ({ id }) => {
			trcpUtils.dictionary.word.get.invalidate({ id });
			trcpUtils.dictionary.word.getAll.invalidate();
		},
	});
	const [searchTerm, setSearchTerm] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [sortByColumn, setSortByColumn] = useState<{
		column: keyof Exclude<typeof allWords.data, undefined>[number];
		order: "asc" | "desc";
	}>();

	const removeWordHandler = useCallback(
		(id: string) => {
			removeWord.mutate({ id });
		},
		[removeWord]
	);

	const pageSearchResult = useMemo(() => {
		if (!allWords.data) {
			return [];
		}
		setPage(0);
		const re = new RegExp(searchTerm.trim() || ".*", "g");
		return allWords.data.filter(
			(word) =>
				word.translations.join(" ").search(re) > -1 || word.word.search(re) > -1
		);
	}, [allWords.data, searchTerm]);

	const sortedPage = useMemo(() => {
		if (!sortByColumn) {
			return pageSearchResult;
		}

		const sortedPageResult = [...pageSearchResult];
		sortedPageResult.sort((a, b) => {
			const t1 = a[sortByColumn.column];
			const t2 = b[sortByColumn.column];

			if (t1 instanceof Date && t2 instanceof Date) {
				if (sortByColumn.order === "asc") {
					return t1.getTime() - t2.getTime();
				} else {
					return t2.getTime() - t1.getTime();
				}
			}

			if (Array.isArray(t1) && Array.isArray(t2)) {
				if (sortByColumn.order === "asc") {
					return t1.join(" ").localeCompare(t2.join(" "));
				} else {
					return t2.join(" ").localeCompare(t1.join(" "));
				}
			}

			if (typeof t1 === "string" && typeof t2 === "string") {
				if (sortByColumn.order === "asc") {
					return t1.localeCompare(t2);
				} else {
					return t2.localeCompare(t1);
				}
			}

			return 1;
		});
		return sortedPageResult;
	}, [sortByColumn, pageSearchResult]);

	const pageSlice = useMemo(() => {
		const startIndex = page * pageSize;
		const endIndex = startIndex + pageSize;
		return sortedPage.slice(startIndex, endIndex);
	}, [page, pageSize, sortedPage]);

	const pageCount = useMemo(() => {
		return Math.ceil(pageSearchResult.length / pageSize);
	}, [pageSearchResult.length, pageSize]);

	const updateSearchTerm = useCallback(
		(search: string) => {
			setSearchTerm(search);
		},
		[setSearchTerm]
	);

	const addSortColumn = useCallback(
		(columnName: Exclude<typeof sortByColumn, undefined>["column"]) => {
			if (!sortByColumn || sortByColumn.column !== columnName) {
				setSortByColumn({ column: columnName, order: "asc" });
			} else {
				// toggle order
				let newOrder: "asc" | "desc";
				if (sortByColumn.order === "asc") {
					newOrder = "desc";
				} else {
					newOrder = "asc";
				}
				setSortByColumn({
					column: columnName,
					order: newOrder,
				});
			}
		},
		[sortByColumn]
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
			justifyContent="flex-start"
			alignItems="center"
			flexDir="column"
		>
			<Card maxW="1000px" w="100%">
				<CardHeader>
					<Box
						display="flex"
						justifyContent="center"
						alignItems="center"
						gap={5}
						pos="sticky"
						top="0"
						bg="white"
						pt={4}
						flexWrap="wrap"
					>
						<Box display="flex" gap={4} alignItems="center" zIndex={50}>
							<RiTranslate size="2em" color={brand500} />
							<Text as="h1" fontSize="2em" color="brand.500">
								Dictionary
							</Text>
						</Box>
						<InputGroup flexGrow="1" w="200px">
							<InputLeftElement pointerEvents="none">
								<IoSearch />
							</InputLeftElement>
							<Input
								variant="filled"
								type="text"
								placeholder="Search for documents"
								value={searchTerm}
								onChange={(e) => updateSearchTerm(e.target.value)}
							/>
							<InputRightElement>
								<IconButton
									icon={<IoClose />}
									onClick={() => setSearchTerm("")}
									aria-label="Clear Search"
									variant="link"
								/>
							</InputRightElement>
						</InputGroup>
						<Box display="flex" gap={2} alignItems="center">
							<ButtonGroup variant="outline" isAttached>
								<IconButton icon={<IoFilter />} aria-label="Filter" />
								<IconButton
									icon={<IoArrowBack />}
									isDisabled={page <= 0}
									onClick={() => setPage(page - 1)}
									aria-label="Backward"
								/>
								<IconButton
									isDisabled={page + 1 >= pageCount}
									onClick={() => setPage(page + 1)}
									icon={<IoArrowForward />}
									aria-label="Forward"
								/>
							</ButtonGroup>
							<Box>
								<CircularProgress
									value={((page + 1) / pageCount) * 100}
									size="35px"
									color="brand.500"
								/>
							</Box>
						</Box>
					</Box>
				</CardHeader>

				<CardBody>
					<Skeleton isLoaded={!allWords.isLoading}>
						<TableContainer pt={5}>
							<Table size="md">
								<Thead>
									<Tr>
										<Th w="100px">#</Th>
										<Th flexGrow="1">
											<Box display="flex">
												<Text>Word</Text>
												<IconButton
													onClick={() => addSortColumn("word")}
													variant="link"
													aria-label="Sort by Date"
													icon={
														sortByColumn?.column === "word" ? (
															sortByColumn.order === "asc" ? (
																<IoArrowDown />
															) : (
																<IoArrowUp />
															)
														) : (
															<IoSwapVertical />
														)
													}
												/>
											</Box>
										</Th>
										<Th flexGrow="1">
											<Box display="flex">
												<Text>Translations</Text>
												<IconButton
													onClick={() => addSortColumn("translations")}
													variant="link"
													aria-label="Sort by Date"
													icon={
														sortByColumn?.column === "translations" ? (
															sortByColumn.order === "asc" ? (
																<IoArrowDown />
															) : (
																<IoArrowUp />
															)
														) : (
															<IoSwapVertical />
														)
													}
												/>
											</Box>
										</Th>
										<Th flexGrow="1">
											<Box display="flex">
												<Text>Tags</Text>
											</Box>
										</Th>
										<Th w="150px">
											<Box display="flex">
												<Text>Created at</Text>
												<IconButton
													onClick={() => addSortColumn("createdAt")}
													variant="link"
													aria-label="Sort by Date"
													icon={
														sortByColumn?.column === "createdAt" ? (
															sortByColumn.order === "asc" ? (
																<IoArrowDown />
															) : (
																<IoArrowUp />
															)
														) : (
															<IoSwapVertical />
														)
													}
												/>
											</Box>
										</Th>
										<Th w="50px"></Th>
									</Tr>
								</Thead>
								<Tbody>
									{pageSlice.map((entry, index) => {
										return (
											<Tr key={entry.id}>
												<Td>{page * pageSize + index + 1}</Td>
												<Td>
													<Link
														as={NextLink}
														href={`/app/dictionary/${entry.id}`}
													>
														{entry.word}
													</Link>
												</Td>
												<Td>{entry.translations.join(", ")}</Td>
												<Td>{entry.tags.map((tag) => tag.name).join(", ")}</Td>
												<Td>{entry.createdAt.toLocaleDateString()}</Td>
												<Td w="50px">
													<IconButton
														size="sm"
														variant="ghost"
														aria-label="delete word"
														icon={<IoTrashBin />}
														sx={{
															"&:hover": {
																bg: "red.400",
																color: "white",
															},
														}}
														onClick={() => removeWordHandler(entry.id)}
													>
														Delete Word
													</IconButton>
												</Td>
											</Tr>
										);
									})}
								</Tbody>
							</Table>
						</TableContainer>
					</Skeleton>
				</CardBody>
			</Card>
		</Box>
	);
};

DictionaryPage.getLayout = function getLayout(page: ReactElement) {
	return <Layout>{page}</Layout>;
};

export const getServerSideProps = async (
	context: GetServerSidePropsContext
) => {
	return protectPage(context);
};

export default DictionaryPage;
