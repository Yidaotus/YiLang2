import type { NextPageWithLayout } from "pages/_app";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";

import Layout from "@components/Layout";
import { trpc } from "@utils/trpc";
import { useRouter } from "next/router";
import { useCallback } from "react";
import {
	Table,
	Thead,
	Tr,
	Th,
	Tbody,
	Td,
	TableContainer,
	Box,
	Input,
	InputGroup,
	Button,
	InputLeftElement,
	IconButton,
	Text,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	ButtonGroup,
	CircularProgress,
	InputRightElement,
	useToken,
	Skeleton,
} from "@chakra-ui/react";

import {
	IoSearch,
	IoFilter,
	IoArrowForward,
	IoArrowBack,
	IoEllipsisVertical,
	IoTrashBin,
	IoPencil,
	IoClose,
	IoArrowDown,
	IoArrowUp,
	IoSwapVertical,
	IoLibrary,
} from "react-icons/io5";
import protectPage from "@utils/protectPage";
import { GetServerSidePropsContext } from "next";

const MAX_PAGINATION_BUTTONS = 5;

const DocumentsPage: NextPageWithLayout = () => {
	const [text400, brand500] = useToken("colors", ["text.400", "brand.500"]);
	const router = useRouter();
	const utils = trpc.useContext();
	const apiDeleteDocument = trpc.document.removeDocument.useMutation({
		onSuccess() {
			utils.document.getAll.invalidate();
		},
	});
	const allDocuments = trpc.document.getAll.useQuery(undefined, {
		refetchOnWindowFocus: false,
	});
	const [searchTerm, setSearchTerm] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [sortByColumn, setSortByColumn] = useState<{
		column: keyof Exclude<typeof allDocuments.data, undefined>[number];
		order: "asc" | "desc";
	}>({ column: "createdAt", order: "desc" });

	const pageSearchResult = useMemo(() => {
		if (!allDocuments.data) {
			return [];
		}
		setPage(0);
		const re = new RegExp(searchTerm || ".*", "g");
		return allDocuments.data.filter((doc) => doc.title.search(re) > -1);
	}, [allDocuments.data, searchTerm]);

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

	const loadDocumentFromId = useCallback(
		(id: string) => {
			router.push(`/app/editor/${id}`);
		},
		[router]
	);

	const updateSearchTerm = useCallback(
		(search: string) => {
			setSearchTerm(search);
		},
		[setSearchTerm]
	);

	const paginationFillerElements = useMemo(() => {
		return [];
		const pageDifference = pageSize - pageSlice.length;
		const filler = [];
		for (let index = 0; index < pageDifference; index++) {
			filler.push(
				<Tr h="55px">
					<Td />
					<Td />
					<Td />
					<Td />
				</Tr>
			);
		}
		return filler;
	}, [pageSize, pageSlice.length]);

	const paginationButtons = useMemo(() => {
		const buttons = [];
		for (let i = 0; i < Math.min(MAX_PAGINATION_BUTTONS, pageCount); i++) {
			const pageNumber = i;
			buttons.push(
				<Button onClick={() => setPage(pageNumber)} variant="link">
					{page === pageNumber ? <b>{pageNumber + 1}</b> : pageNumber + 1}
				</Button>
			);
		}
		return buttons;
	}, [page, pageCount]);

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

	const deleteDocument = useCallback(
		(id: string) => {
			apiDeleteDocument.mutate(id);
		},
		[apiDeleteDocument]
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
				<Box pb={4} display="flex" gap={4} alignItems="center">
					<IoLibrary size="3em" color={brand500} />
					<Text as="h1" fontSize="3em" color="brand.500">
						Documents
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
			<Skeleton
				isLoaded={!allDocuments.isLoading && !apiDeleteDocument.isLoading}
			>
				<TableContainer pt={5}>
					<Table size="md">
						<Thead>
							<Tr>
								<Th w="100px">#</Th>
								<Th flexGrow="1">
									<Box display="flex">
										<Text>Title</Text>
										<IconButton
											onClick={() => addSortColumn("title")}
											variant="link"
											aria-label="Sort by Title"
											icon={
												sortByColumn?.column === "title" ? (
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
											<Button
												color="brand.500"
												variant="link"
												onClick={() => loadDocumentFromId(entry.id)}
											>
												{entry.title}
											</Button>
										</Td>
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
													<MenuItem
														icon={<IoPencil />}
														onClick={() => loadDocumentFromId(entry.id)}
													>
														Open Document
													</MenuItem>
													<MenuItem
														icon={<IoTrashBin />}
														bg="#e11d48"
														color="#FFFFFF"
														onClick={() => deleteDocument(entry.id)}
													>
														Delete Document
													</MenuItem>
												</MenuList>
											</Menu>
										</Td>
									</Tr>
								);
							})}
							{paginationFillerElements}
						</Tbody>
					</Table>
				</TableContainer>
			</Skeleton>
		</Box>
	);
};

DocumentsPage.getLayout = function getLayout(page: ReactElement) {
	return <Layout>{page}</Layout>;
};

export const getServerSideProps = async (
	context: GetServerSidePropsContext
) => {
	return protectPage(context);
};

export default DocumentsPage;
