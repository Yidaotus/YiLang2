import type { NextPageWithLayout } from "pages/_app";
import type { ReactElement } from "react";
import { useCallback } from "react";

import {
	Avatar,
	Box,
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	Link,
	Select,
	SkeletonText,
	Stat,
	StatGroup,
	StatLabel,
	StatNumber,
	Table,
	TableCaption,
	TableContainer,
	Tbody,
	Td,
	Text,
	Th,
	Thead,
	Tr,
	useToast,
	useToken,
} from "@chakra-ui/react";
import Layout from "@components/Layout";
import useEditorSettingsStore, { useEditorSettingsActions } from "@store/store";
import protectPage from "@utils/protectPage";
import { trpc } from "@utils/trpc";
import type { GetServerSidePropsContext } from "next";
import { useSession } from "next-auth/react";
import NextLink from "next/link";
import {
	IoDocumentOutline,
	IoLanguageOutline,
	IoMailOutline,
} from "react-icons/io5";

const DashboardPage: NextPageWithLayout = () => {
	const [iconActive] = useToken("colors", ["brand.500"]);

	const toast = useToast();

	const { data: session } = useSession();

	const activeLanguage = useEditorSettingsStore(
		(store) => store.selectedLanguage
	);
	const { setSelectedLanguage } = useEditorSettingsActions();

	const userStats = trpc.user.stats.useQuery();

	const allLanguages = trpc.dictionary.language.getAll.useQuery();
	const recentWords = trpc.dictionary.word.getRecent.useQuery({ take: 10 });
	const recentDocuments = trpc.document.getRecent.useQuery({
		take: 10,
	});

	const switchActiveLanguage = useCallback(
		(id: string) => {
			const selectedLanguage = allLanguages.data?.find(
				(language) => language.id === id
			);

			if (selectedLanguage) {
				setSelectedLanguage({
					id,
					name: selectedLanguage.name,
				});
				toast({
					title: "Language switched",
					description: `Active language switched to ${selectedLanguage.name}`,
					status: "success",
					duration: 9000,
					isClosable: true,
				});
			}
		},
		[allLanguages.data, setSelectedLanguage, toast]
	);

	return (
		<Box display="flex" flexDir="column" maxH="100vh" overflow="auto" py="2">
			<Box
				maxW="100%"
				display="flex"
				flexDir="column"
				justifyContent="center"
				alignItems="center"
				pt="12"
				gap="12"
			>
				<Card maxW="1000px" w="80%">
					<CardBody>
						<Box
							display="flex"
							gap={[4, null, null, 12]}
							alignItems="flex-start"
							flexDir="row"
							flexWrap="wrap"
							overflowX="hidden"
						>
							<Box display="flex" gap="4" alignItems="center">
								<Avatar
									referrerPolicy="no-referrer"
									bg="text.100"
									name={session?.user?.name || "unkown"}
									src={session?.user?.image || undefined}
									size={["md", "lg", "xl"]}
								/>
								<Box>
									<Text color="text.500" fontSize={["1.6rem", null, "2rem"]}>
										{session?.user?.name}
									</Text>
									<Box display="flex" gap="1" alignItems="center">
										<IoMailOutline color={iconActive} />
										<Text color="text.400">{session?.user?.email}</Text>
									</Box>
								</Box>
							</Box>
							<Box
								display="flex"
								pt="3"
								flexDir={["column", null, "row"]}
								w={["100%", null, "initial"]}
								gap="4"
							>
								<StatGroup w={["100%", null, "300px"]} gap={4}>
									<Stat>
										<StatLabel>Collected Words</StatLabel>
										<StatNumber
											color="brand.500"
											display="flex"
											alignItems="center"
											gap="1"
										>
											<IoLanguageOutline /> {userStats.data?.wordCount || 0}
										</StatNumber>
									</Stat>
									<Stat>
										<StatLabel>Documents</StatLabel>
										<StatNumber
											color="brand.500"
											display="flex"
											alignItems="center"
											gap="1"
										>
											<IoDocumentOutline /> {userStats.data?.documentCount || 0}
										</StatNumber>
									</Stat>
								</StatGroup>
								<Box minW={["100%", null, "180px"]}>
									<Text fontSize="0.875rem" fontWeight="medium">
										Active Language
									</Text>
									<Select
										minW={["100%", null, "180px"]}
										size="md"
										value={activeLanguage.id}
										onChange={(e) => switchActiveLanguage(e.target.value)}
									>
										{allLanguages.data?.map((language) => (
											<option key={language.id} value={language.id}>
												{language.name}
											</option>
										))}
									</Select>
								</Box>
							</Box>
						</Box>
					</CardBody>
				</Card>
				<Card maxW="1000px" w="80%">
					<CardHeader>
						<Box display="flex" alignItems="center" gap="2" as="h1">
							<IoLanguageOutline color={iconActive} size="1.5rem" />
							<Text fontSize="1.5rem" color="brand.500">
								Recent Vocabluary
							</Text>
						</Box>
					</CardHeader>

					<CardBody>
						<SkeletonText
							noOfLines={4}
							spacing="4"
							skeletonHeight="2"
							isLoaded={!recentWords.isLoading}
							w="100%"
							maxW="1000px"
							alignSelf="center"
						>
							<TableContainer>
								<Table variant="simple" color="text.500">
									<TableCaption>Good Work!</TableCaption>
									<Thead>
										<Tr>
											<Th>Word</Th>
											<Th>Translations</Th>
											<Th>Language</Th>
											<Th>Created At</Th>
										</Tr>
									</Thead>
									<Tbody>
										{recentWords.data?.map((word) => (
											<Tr key={word.id}>
												<Td color="brand.500" fontWeight="semibold">
													<Link
														as={NextLink}
														href={`/app/dictionary/${word.id}`}
													>
														{word.word}
													</Link>
												</Td>
												<Td>{word.translations.join(", ")}</Td>
												<Td>{word.language.name}</Td>
												<Td>{word.createdAt.toLocaleDateString()}</Td>
											</Tr>
										))}
									</Tbody>
								</Table>
							</TableContainer>
						</SkeletonText>
					</CardBody>
					<CardFooter></CardFooter>
				</Card>
				<Card maxW="1000px" w="80%">
					<CardHeader>
						<Box display="flex" alignItems="center" gap="2" as="h1">
							<IoDocumentOutline color={iconActive} size="1.5rem" />
							<Text fontSize="1.5rem" color="brand.500">
								Recent Documents
							</Text>
						</Box>
					</CardHeader>

					<CardBody>
						<SkeletonText
							noOfLines={4}
							spacing="4"
							skeletonHeight="2"
							isLoaded={!recentDocuments.isLoading}
							w="100%"
							maxW="1000px"
							alignSelf="center"
						>
							<TableContainer>
								<Table variant="simple" color="text.500">
									<TableCaption>Good Work!</TableCaption>
									<Thead>
										<Tr>
											<Th>Title</Th>
											<Th>Language</Th>
											<Th>Created At</Th>
										</Tr>
									</Thead>
									<Tbody>
										{recentDocuments.data?.map((doc) => (
											<Tr key={doc.id}>
												<Td color="brand.500" fontWeight="semibold">
													<Link
														as={NextLink}
														href={`/app/editor/${doc.id}`}
														passHref
													>
														{doc.title}
													</Link>
												</Td>
												<Td>{doc.language.name}</Td>
												<Td>{doc.createdAt.toLocaleDateString()}</Td>
											</Tr>
										))}
									</Tbody>
								</Table>
							</TableContainer>
						</SkeletonText>
					</CardBody>
					<CardFooter></CardFooter>
				</Card>
			</Box>
		</Box>
	);
};

DashboardPage.getLayout = function getLayout(page: ReactElement) {
	return <Layout>{page}</Layout>;
};

export const getServerSideProps = async (
	context: GetServerSidePropsContext
) => {
	return protectPage(context);
};

export default DashboardPage;
