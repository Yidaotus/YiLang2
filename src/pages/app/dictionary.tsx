import type { NextPageWithLayout } from "pages/_app";
import type { ReactElement } from "react";
import { useCallback, useMemo, useState } from "react";

import {
	Box,
	ButtonGroup,
	CircularProgress,
	IconButton,
	Input,
	InputGroup,
	InputLeftElement,
	InputRightElement,
	Link,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
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
import useEditorStore from "@store/store";
import protectPage from "@utils/protectPage";
import type { GetServerSidePropsContext } from "next";
import NextLink from "next/link";
import {
	IoArrowBack,
	IoArrowDown,
	IoArrowForward,
	IoArrowUp,
	IoClose,
	IoEllipsisVertical,
	IoFilter,
	IoPencil,
	IoSearch,
	IoSwapVertical,
	IoTrashBin,
} from "react-icons/io5";
import { RiTranslate } from "react-icons/ri";
import { trpc } from "../../utils/trpc";

const DictionaryPage: NextPageWithLayout = () => {
	const [text400, brand500] = useToken("colors", ["text.400", "brand.500"]);
	const selectedLanguage = useEditorStore((state) => state.selectedLanguage);
	const allWords = trpc.dictionary.getAll.useQuery({
		language: selectedLanguage.id,
	});
	const [searchTerm, setSearchTerm] = useState("");
	const [pageSize, setPageSize] = useState(20);
	const [page, setPage] = useState(0);
	const [sortByColumn, setSortByColumn] = useState<{
		column: keyof Exclude<typeof allWords.data, undefined>[number];
		order: "asc" | "desc";
	}>();

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
		<Box px={[6, 8, 12]} maxH="100vh" overflow="auto" pos="relative">
			<Box
				display="flex"
				justifyContent="flex-end"
				alignItems="center"
				gap={5}
				pos="sticky"
				top="0"
				bg="white"
				pt={4}
			>
				<Box pb={4} display="flex" gap={4} alignItems="center" zIndex={50}>
					<RiTranslate size="3em" color={brand500} />
					<Text as="h1" fontSize="3em" color="brand.500">
						Dictionary
					</Text>
				</Box>
				<InputGroup>
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
						<Tbody color="text.400">
							{pageSlice.map((entry, index) => {
								return (
									<Tr key={entry.id}>
										<Td>{page * pageSize + index + 1}</Td>
										<Td>
											<Link as={NextLink} href={`/app/dictionary/${entry.id}`}>
												{entry.word}
											</Link>
										</Td>
										<Td>{entry.translations.join(", ")}</Td>
										<Td>{entry.tags.map((tag) => tag.name).join(", ")}</Td>
										<Td>{entry.createdAt.toLocaleDateString()}</Td>
										<Td w="50px">
											<Menu isLazy>
												<MenuButton
													as={IconButton}
													aria-label="Options"
													icon={<IoEllipsisVertical />}
													variant="link"
												/>
												<MenuList>
													<MenuItem icon={<IoPencil />}>Open Document</MenuItem>
													<MenuItem
														icon={<IoTrashBin />}
														bg="#e11d48"
														color="#FFFFFF"
													>
														Delete Document
													</MenuItem>
												</MenuList>
											</Menu>
										</Td>
									</Tr>
								);
							})}
						</Tbody>
					</Table>
				</TableContainer>
			</Skeleton>
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
