import type { NextPageWithLayout } from "pages/_app";
import { ReactElement, useMemo, useState } from "react";

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
	Stack,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	ButtonGroup,
	CircularProgress,
	InputRightElement,
} from "@chakra-ui/react";

import {
	IoSearch,
	IoFilter,
	IoAdd,
	IoArrowForward,
	IoArrowBack,
	IoEllipsisVertical,
	IoRemove,
	IoOpen,
	IoTrashBin,
	IoPencil,
	IoClose,
	IoArrowDown,
} from "react-icons/io5";

const MAX_PAGINATION_BUTTONS = 5;

type compareFn<T> = (a: T, b: T) => number;

const DocumentsPage: NextPageWithLayout = () => {
	const router = useRouter();
	const allDocuments = trpc.document.getAll.useQuery(undefined, {
		refetchOnWindowFocus: false,
	});
	const [searchTerm, setSearchTerm] = useState("");
	const [pageSize, setPageSize] = useState(4);
	const [page, setPage] = useState(0);
	const [sortByColumns, setSortByColumns] = useState<
		Array<{
			column: keyof Exclude<typeof allDocuments.data, undefined>[number];
			order: "asc" | "desc";
		}>
	>([]);

	const pageSearchResult = useMemo(() => {
		if (!allDocuments.data) {
			return [];
		}
		setPage(0);
		const re = new RegExp(searchTerm || ".*", "g");
		return allDocuments.data.filter((doc) => doc.title.search(re) > -1);
	}, [allDocuments.data, searchTerm]);

	const sortedPage = useMemo(() => {
		const sortedPageResult = [...pageSearchResult];
		for (const sorter of sortByColumns) {
			sortedPageResult.sort((a, b) => {
				const t1 = a[sorter.column];
				const t2 = b[sorter.column];

				if (t1 instanceof Date && t2 instanceof Date) {
					if (sorter.order === "asc") {
						return t1.getTime() - t2.getTime();
					} else {
						return t2.getTime() - t1.getTime();
					}
				}

				if (typeof t1 === "string" && typeof t2 === "string") {
					if (sorter.order === "asc") {
						return t1.localeCompare(t2);
					} else {
						return t2.localeCompare(t1);
					}
				}

				return 1;
			});
		}
		return sortedPageResult;
	}, [sortByColumns, pageSearchResult]);

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
		(columnName: typeof sortByColumns[number]["column"]) => {
			const sorterIndex = sortByColumns.findIndex(
				(sorter) => sorter.column === columnName
			);
			const sorterItem = sortByColumns[sorterIndex];
			if (sorterItem) {
				// toggle order
				let newOrder: "asc" | "desc";
				if (sorterItem.order === "asc") {
					newOrder = "desc";
				} else {
					newOrder = "asc";
				}
				const newSorterColumns = [...sortByColumns];
				newSorterColumns.splice(sorterIndex, 1, {
					column: sorterItem.column,
					order: newOrder,
				});
				setSortByColumns(newSorterColumns);
			} else {
				setSortByColumns([
					...sortByColumns,
					{ column: columnName, order: "asc" },
				]);
			}
		},
		[sortByColumns]
	);

	return (
		<Box>
			<Box display="flex" justifyContent="flex-end" gap={5}>
				<Button
					leftIcon={<IoAdd />}
					px={6}
					variant="solid"
					bg="#1A5660"
					color="#FFFFFF"
					sx={{
						"&:hover": {
							bg: "#164750",
						},
					}}
				>
					New Document
				</Button>
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
					/>
				</Box>
			</Box>
			<TableContainer pt={5}>
				<Table variant="striped" size={{ sm: "sm", md: "md", lg: "lg" }}>
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
										icon={<IoArrowDown />}
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
										icon={<IoArrowDown />}
									/>
								</Box>
							</Th>
							<Th w="50px"></Th>
						</Tr>
					</Thead>
					<Tbody>
						{pageSlice.map((entry, index) => {
							return (
								<Tr key={entry.id} h="55px">
									<Td>{page * pageSize + index + 1}</Td>
									<Td>
										<Button
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
		</Box>
	);
};

DocumentsPage.getLayout = function getLayout(page: ReactElement) {
	return <Layout>{page}</Layout>;
};

export default DocumentsPage;
