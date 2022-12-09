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
	Tfoot,
	Stack,
} from "@chakra-ui/react";

import {
	IoSearch,
	IoFilter,
	IoAdd,
	IoArrowForward,
	IoArrowBack,
} from "react-icons/io5";

const DocumentsPage: NextPageWithLayout = () => {
	const router = useRouter();
	const allDocuments = trpc.document.getAll.useQuery();
	const [searchTerm, setSearchTerm] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);

	const pageSearchResult = useMemo(() => {
		if (!allDocuments.data) {
			return [];
		}
		setPage(0);
		const re = new RegExp(searchTerm || ".*", "g");
		return allDocuments.data.filter((doc) => doc.title.search(re) > -1);
	}, [allDocuments.data, searchTerm]);

	const pageSlice = useMemo(() => {
		const startIndex = page * pageSize;
		const endIndex = startIndex + pageSize;
		return pageSearchResult.slice(startIndex, endIndex);
	}, [page, pageSize, pageSearchResult]);

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
				</Tr>
			);
		}
		return filler;
	}, [pageSize, pageSlice.length]);

	const paginationButtons = useMemo(() => {
		const buttons = [];
		for (let i = 0; i < pageCount; i++) {
			buttons.push(
				<Button onClick={() => setPage(i)} variant="link">
					{page === i ? <b>{i + 1}</b> : i + 1}
				</Button>
			);
		}
		return buttons;
	}, [page, pageCount]);

	return (
		<Box>
			<Box display="flex" justifyContent="flex-end" gap={5}>
				<InputGroup>
					<InputLeftElement pointerEvents="none">
						<IoSearch />
					</InputLeftElement>
					<Input
						type="tel"
						placeholder="Search for documents"
						onChange={(e) => updateSearchTerm(e.target.value)}
					/>
				</InputGroup>
				<IconButton icon={<IoFilter />} aria-label="Filter" />
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
			</Box>
			<TableContainer>
				<Table variant="striped">
					<Thead>
						<Tr>
							<Th w="100px">#</Th>
							<Th flexGrow="1">Title</Th>
							<Th w="150px">Created at</Th>
						</Tr>
					</Thead>
					<Tbody>
						{pageSlice.map((entry, index) => (
							<Tr key={entry.id} h="55px">
								<Td>{page * pageSize + index + 1}</Td>
								<Td>{entry.title}</Td>
								<Td>{entry.createdAt.toLocaleDateString()}</Td>
							</Tr>
						))}
						{paginationFillerElements}
					</Tbody>
				</Table>
				<Box display="flex" justifyContent="center" alignItems="center" pt={5}>
					<Stack direction="row" justifyContent="center" alignItems="center">
						<IconButton
							icon={<IoArrowBack />}
							isDisabled={page <= 0}
							onClick={() => setPage(page - 1)}
							aria-label="Backward"
						/>
						<Box>{paginationButtons}</Box>
						<IconButton
							isDisabled={page + 1 >= pageCount}
							onClick={() => setPage(page + 1)}
							icon={<IoArrowForward />}
							aria-label="Forward"
						/>
					</Stack>
				</Box>
			</TableContainer>
		</Box>
	);
};

DocumentsPage.getLayout = function getLayout(page: ReactElement) {
	return <Layout>{page}</Layout>;
};

export default DocumentsPage;
