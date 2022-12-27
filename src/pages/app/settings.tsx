import type { NextPageWithLayout } from "pages/_app";
import { ReactElement, useCallback, useState } from "react";

import Layout from "@components/Layout";
import {
	Accordion,
	AccordionButton,
	AccordionIcon,
	AccordionItem,
	AccordionPanel,
	Avatar,
	Box,
	Button,
	ButtonGroup,
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	Divider,
	Heading,
	IconButton,
	Input,
	List,
	ListItem,
	Skeleton,
	SkeletonText,
	Stack,
	StackDivider,
	Stat,
	StatGroup,
	StatHelpText,
	StatLabel,
	StatNumber,
	Text,
	useToken,
} from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { GetServerSidePropsContext } from "next";
import protectPage from "@utils/protectPage";
import { Session } from "next-auth";
import {
	IoAdd,
	IoDocumentOutline,
	IoLanguageOutline,
	IoMailOutline,
	IoPencil,
	IoSave,
	IoSearchOutline,
	IoSettingsOutline,
	IoTrashBin,
} from "react-icons/io5";
import { RxPencil1 } from "react-icons/rx";
import { trpc } from "@utils/trpc";

type DictionaryPageProps = {
	session: Session;
};
const DictionaryPage: NextPageWithLayout = () => {
	const [iconInactive, iconActive] = useToken("colors", [
		"text.300",
		"brand.500",
	]);

	const [languageNameInput, setLanguageNameInput] = useState("");
	const [showLanguageNameInput, setShowLanguageNameInput] = useState(false);

	const { data: session } = useSession();
	const trpcUtils = trpc.useContext();
	const allLanguages = trpc.dictionary.getAllLanguages.useQuery();
	const apiAddLanguage = trpc.dictionary.addLanguage.useMutation({
		onSuccess() {
			trpcUtils.dictionary.getAllLanguages.invalidate();
		},
	});
	const apiChangeLanguageName = trpc.dictionary.changeLanguageName.useMutation({
		onSuccess() {
			trpcUtils.dictionary.getAllLanguages.invalidate();
		},
	});
	const apiAddLookupSource = trpc.dictionary.addLookupSource.useMutation({
		onSuccess() {
			trpcUtils.dictionary.getAllLanguages.invalidate();
		},
	});
	const apiRemoveLookupSource = trpc.dictionary.removeLookupSource.useMutation({
		onSuccess() {
			trpcUtils.dictionary.getAllLanguages.invalidate();
		},
	});
	const apiRemoveLanguage = trpc.dictionary.removeLanguage.useMutation({
		onSuccess() {
			trpcUtils.dictionary.getAllLanguages.invalidate();
		},
	});

	const isLoading = apiAddLanguage.isLoading || allLanguages.isLoading;

	const addLanguage = useCallback(() => {
		if (languageNameInput) {
			apiAddLanguage.mutate({ name: languageNameInput.trim() });
		}
		setLanguageNameInput("");
		setShowLanguageNameInput(false);
	}, [apiAddLanguage, languageNameInput]);

	const handleLanguageNameInputKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				addLanguage();
			}
		},
		[addLanguage]
	);

	if (!session) return null;
	return (
		<Box display="flex" flexDir="column">
			<Box as="section" pl="6rem" pt="2rem">
				<Box display="flex" gap={12} alignItems="flex-start">
					<Avatar
						referrerPolicy="no-referrer"
						bg="text.100"
						name={session.user?.name || "unkown"}
						src={session.user?.image || undefined}
						size="xl"
					/>
					<Box>
						<Text color="text.500" fontSize="2rem">
							{session.user?.name}
						</Text>
						<Box display="flex" gap="1" alignItems="center">
							<IoMailOutline color={iconActive} />
							<Text color="text.400">{session.user?.email}</Text>
						</Box>
					</Box>
					<StatGroup w="300px">
						<Stat>
							<StatLabel>Collected Words</StatLabel>
							<StatNumber
								color="brand.500"
								display="flex"
								alignItems="center"
								gap="1"
							>
								<IoLanguageOutline /> 52
							</StatNumber>
							<StatHelpText>Feb 12 - Feb 28</StatHelpText>
						</Stat>
						<Stat>
							<StatLabel>Documents</StatLabel>
							<StatNumber
								color="brand.500"
								display="flex"
								alignItems="center"
								gap="1"
							>
								<IoDocumentOutline /> 19
							</StatNumber>
							<StatHelpText>Feb 12 - Feb 28</StatHelpText>
						</Stat>
					</StatGroup>
				</Box>
			</Box>
			<Divider py="2" />
			<SkeletonText
				noOfLines={4}
				spacing="4"
				skeletonHeight="2"
				isLoaded={!isLoading}
				w="100%"
				maxW="1000px"
				alignSelf="center"
				mt="12"
			>
				{allLanguages.data && (
					<Card w="100%" maxW="1000px" alignSelf="center" mt="12">
						<CardHeader>
							<Box display="flex" alignItems="center" gap="2" as="h1">
								<IoLanguageOutline color={iconActive} size="2.5rem" />
								<Heading size="lg" color="brand.500">
									Languages
								</Heading>
							</Box>
						</CardHeader>

						<CardBody>
							<Accordion allowToggle>
								{allLanguages.data.map((language) => (
									<AccordionItem key={language.id}>
										<h2>
											<AccordionButton
												display="flex"
												justifyContent="space-between"
												textAlign="left"
												_expanded={{ bg: "brand.500", color: "white" }}
											>
												<Box>
													<Heading size="md" textTransform="uppercase">
														{language.name}
													</Heading>
													<Text pt="2" fontSize="sm">
														2 Documents, 142 Words, 53 Sentences
													</Text>
												</Box>
												<AccordionIcon />
											</AccordionButton>
										</h2>
										<AccordionPanel pb={4}>
											<Box
												display="flex"
												gap="4"
												alignItems="center"
												fontSize="1.3rem"
												pb="2"
											>
												<IoSettingsOutline />
												<Text>General</Text>
											</Box>
											<Box display="flex" gap="4" pl="9" alignItems="center">
												<Text color="text.400" w="80px">
													Name
												</Text>
												<Text color="text.500">{language.name}</Text>
												<IconButton
													ml="auto"
													variant="ghost"
													aria-label="edit"
													icon={<RxPencil1 />}
												/>
											</Box>
											<Box
												display="flex"
												gap="4"
												alignItems="center"
												fontSize="1.3rem"
												pt="5"
												pb="2"
											>
												<IoSearchOutline />
												<Text>Lookup Sources</Text>
												<IconButton
													variant="ghost"
													aria-label="add lookup source"
													icon={<IoAdd />}
													ml="auto"
												/>
											</Box>
											<List pl="9">
												{language.lookupSources.map((lookupSource) => (
													<ListItem
														key={lookupSource.id}
														display="flex"
														alignItems="center"
														gap="4"
														h="50px"
														sx={{
															"&:hover": {
																"div:nth-child(3)": {
																	display: "block",
																},
															},
														}}
													>
														<Text color="text.400" w="80px">
															{lookupSource.name}
														</Text>
														<Box flexGrow="1" color="text.500">
															<Text color="text.500">{lookupSource.url}</Text>
														</Box>
														<Box marginLeft="auto" display="none">
															<ButtonGroup>
																<IconButton
																	icon={<RxPencil1 />}
																	aria-label="edit"
																	variant="ghost"
																/>
																<IconButton
																	icon={<IoTrashBin />}
																	aria-label="edit"
																	color="red"
																	variant="ghost"
																/>
															</ButtonGroup>
														</Box>
													</ListItem>
												))}
											</List>
										</AccordionPanel>
									</AccordionItem>
								))}
							</Accordion>
						</CardBody>
						<CardFooter justifyContent="flex-end">
							{!showLanguageNameInput && (
								<ButtonGroup spacing="2">
									<Button
										variant="solid"
										colorScheme="brand"
										leftIcon={<IoAdd size="1.5rem" />}
										onClick={() => setShowLanguageNameInput(true)}
									>
										Add Language
									</Button>
								</ButtonGroup>
							)}
							{showLanguageNameInput && (
								<Box display="flex" w="full" alignItems="center" gap="4">
									<Box>Name</Box>
									<Input
										value={languageNameInput}
										onChange={(e) => setLanguageNameInput(e.target.value)}
										onKeyDown={handleLanguageNameInputKeyDown}
										autoFocus
									/>
									<ButtonGroup>
										<IconButton
											variant="ghost"
											aria-label="save"
											icon={<IoSave />}
											onClick={addLanguage}
										/>
										<IconButton
											variant="ghost"
											aria-label="save"
											icon={<IoTrashBin />}
											onClick={() => setShowLanguageNameInput(false)}
										/>
									</ButtonGroup>
								</Box>
							)}
						</CardFooter>
					</Card>
				)}
			</SkeletonText>
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
