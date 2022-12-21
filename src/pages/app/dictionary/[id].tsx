import type { ReactElement } from "react";

import type { GetServerSidePropsContext } from "next";

import { useRouter } from "next/router";
import {
	Box,
	Divider,
	Link,
	List,
	ListItem,
	Text,
	useToken,
} from "@chakra-ui/react";

import Layout from "@components/Layout";
import { useSession } from "next-auth/react";
import protectPage from "@utils/protectPage";
import {
	RiAddLine,
	RiCalendarLine,
	RiCloseLine,
	RiHashtag,
	RiPriceTag2Line,
	RiPriceTagLine,
	RiTrainLine,
	RiTranslate,
	RiTranslate2,
} from "react-icons/ri";
import { trpc } from "@utils/trpc";
import { RxCalendar, RxPlus } from "react-icons/rx";
import {
	IoDocumentOutline,
	IoPricetags,
	IoPricetagsOutline,
} from "react-icons/io5";
import NextLink from "next/link";

type DataRowProps = {
	title: React.ReactNode;
	value: React.ReactNode;
};

const DataRow = ({ title, value }: DataRowProps) => (
	<Box display="flex" gap={8}>
		<Box
			w="30%"
			display="flex"
			alignItems="flex-end"
			justifyContent="center"
			flexDir="column"
			color="text.300"
			gap="9px"
		>
			<Box>{title}</Box>
		</Box>
		<Box
			w="70%"
			display="flex"
			alignItems="flex-start"
			justifyContent="center"
			flexDir="column"
			fontSize="1.1em"
			gap={2}
		>
			{value}
		</Box>
	</Box>
);

const DictionaryEntryPag = () => {
	const router = useRouter();
	const { id: routerId } = router.query;
	const id = Array.isArray(routerId) ? routerId[0] : routerId;
	const dbWord = trpc.dictionary.getWord.useQuery(id || "");
	const [text400, brand500] = useToken("colors", ["text.400", "brand.500"]);

	const { data: session } = useSession();

	return (
		<Box display="flex">
			<Box px={[6, 8, 12]} maxH="100vh" pos="relative" w="100vw">
				<Box
					display="flex"
					justifyContent="flex-start"
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
				</Box>
				<Divider w="100%" />
				<Box
					display="flex"
					justifyContent="center"
					alignItems="center"
					w="100%"
					pt={4}
				>
					<Box
						display="flex"
						gap={3}
						flexDir="column"
						fontSize="1.1rem"
						w="100%"
					>
						<DataRow
							title={<Box />}
							value={
								<Box fontSize="2.5em" color="brand.500">
									{dbWord.data?.word}
								</Box>
							}
						/>
						<DataRow
							title={
								<Box display="flex" gap={1} alignItems="center">
									<RiTranslate2 />
									Spelling
								</Box>
							}
							value={<Box color="text.400">{dbWord.data?.spelling}</Box>}
						/>
						<DataRow
							title={
								<Box display="flex" gap={1} alignItems="center">
									<RiTranslate />
									Translation
								</Box>
							}
							value={
								<Box display="flex" gap={2} fontSize="0.85em">
									{dbWord.data?.translations.map((translation) => (
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
										px={1}
										as="button"
										_hover={{
											bg: "text.200",
										}}
									>
										<RiAddLine />
									</Box>
								</Box>
							}
						/>
						<DataRow
							title={
								<Box display="flex" gap={1} alignItems="center">
									<IoPricetagsOutline />
									Tags
								</Box>
							}
							value={
								<Box display="flex" gap={2} fontSize="0.85em" flexWrap="wrap">
									{dbWord.data?.tags.map((tag) => (
										<Box
											key={tag.tagId}
											bg={`${tag.tag.color}55`}
											borderRadius="4px"
											color="text.500"
											display="flex"
											flexWrap="nowrap"
											alignItems="center"
											gap={1}
											pl={2}
										>
											<Text>{tag.tag.name}</Text>
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
										px={1}
										as="button"
										_hover={{
											bg: "text.200",
										}}
									>
										<RxPlus />
									</Box>
								</Box>
							}
						/>
						<DataRow
							title={
								<Box display="flex" gap={1} alignItems="center">
									<RxCalendar />
									Created at
								</Box>
							}
							value={
								<Box color="text.400" fontSize="0.9em">
									{dbWord.data?.createdAt.toLocaleDateString()}
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
								<NextLink
									href={`/app/editor/${dbWord.data?.sourceDocument?.id}?highlight=${dbWord.data?.id}`}
									passHref
								>
									<Link>
										<Text textDecoration="underline" color="text.400">
											{dbWord.data?.sourceDocument?.title}
										</Text>
									</Link>
								</NextLink>
							}
						/>
					</Box>
				</Box>
			</Box>
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
