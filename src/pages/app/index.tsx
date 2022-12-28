import type { NextPageWithLayout } from "pages/_app";
import type { ReactElement } from "react";
import { useCallback } from "react";

import Layout from "@components/Layout";
import {
	Avatar,
	Box,
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	Divider,
	List,
	ListItem,
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
import NextLink from "next/link";
import { useSession } from "next-auth/react";
import type { GetServerSidePropsContext } from "next";
import protectPage from "@utils/protectPage";
import {
	IoDocumentOutline,
	IoLanguageOutline,
	IoMailOutline,
} from "react-icons/io5";
import { trpc } from "@utils/trpc";
import useEditorStore from "@store/store";

const DashboardPage: NextPageWithLayout = () => {
	const [iconInactive, iconActive] = useToken("colors", [
		"text.300",
		"brand.500",
	]);

	const toast = useToast();

	const { data: session } = useSession();

	const activeLanguage = useEditorStore((store) => store.selectedLanguage);
	const setActiveLanguage = useEditorStore(
		(store) => store.setSelectedLanguage
	);

	const userStats = trpc.user.stats.useQuery();

	const allLanguages = trpc.dictionary.getAllLanguages.useQuery();
	const recentWords = trpc.dictionary.getRecentWords.useQuery({ take: 10 });
	const recentDocuments = trpc.dictionary.getRecentDocuments.useQuery({
		take: 10,
	});

	const switchActiveLanguage = useCallback(
		(id: string) => {
			const selectedLanguage = allLanguages.data?.find(
				(language) => language.id === id
			);

			if (selectedLanguage) {
				setActiveLanguage({
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
		[allLanguages.data, setActiveLanguage, toast]
	);

	return (
		<Box display="flex" flexDir="column">
			<Box as="section" px={["6", null, "6rem"]} pt="2rem">
				<Box
					display="flex"
					gap={[4, null, 12]}
					alignItems="flex-start"
					flexDir={["column", null, "row"]}
				>
					<Box display="flex" gap="4">
						<Avatar
							referrerPolicy="no-referrer"
							bg="text.100"
							name={session?.user?.name || "unkown"}
							src={session?.user?.image || undefined}
							size="xl"
						/>
						<Box>
							<Text color="text.500" fontSize="2rem">
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
						<StatGroup w={["100%", null, "300px"]}>
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
			</Box>
			<Divider py="2" />
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
					<CardHeader>
						<Box display="flex" alignItems="center" gap="2" as="h1">
							<IoLanguageOutline color={iconActive} size="2.5rem" />
							<Text fontSize="1.875rem" color="brand.500">
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
												<NextLink href={`/app/dictionary/${word.id}`} passHref>
													<Td color="brand.500" fontWeight="semibold">
														{word.word}
													</Td>
												</NextLink>
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
							<IoDocumentOutline color={iconActive} size="2.5rem" />
							<Text fontSize="1.875rem" color="brand.500">
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
												<NextLink href={`/app/editor/${doc.id}`} passHref>
													<Td color="brand.500" fontWeight="semibold">
														{doc.title}
													</Td>
												</NextLink>
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
