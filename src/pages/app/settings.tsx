import { signOut } from "next-auth/react";
import type { NextPageWithLayout } from "pages/_app";
import type { ReactElement } from "react";
import { useCallback, useRef, useState } from "react";
// @TODO WAY TO BIG!!

import {
	Accordion,
	AccordionButton,
	AccordionIcon,
	AccordionItem,
	AccordionPanel,
	AlertDialog,
	AlertDialogBody,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogOverlay,
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
	Select,
	SkeletonText,
	Stat,
	StatGroup,
	StatLabel,
	StatNumber,
	Text,
	useDisclosure,
	useToast,
	useToken,
} from "@chakra-ui/react";
import Layout from "@components/Layout";
import useEditorSettingsStore, { useEditorSettingsActions } from "@store/store";
import protectPage from "@utils/protectPage";
import type { RouterTypes } from "@utils/trpc";
import { trpc } from "@utils/trpc";
import type { GetServerSidePropsContext } from "next";
import { useSession } from "next-auth/react";
import {
	IoAdd,
	IoClose,
	IoDocumentOutline,
	IoLanguageOutline,
	IoLogOut,
	IoMailOutline,
	IoSave,
	IoSaveOutline,
	IoSearchOutline,
	IoSettingsOutline,
	IoTrashBin,
} from "react-icons/io5";
import { RxPencil1 } from "react-icons/rx";

type InlineLanguageNameInputProps = {
	name: string;
	id: string;
};

const InlineLanguageNameInput = ({
	name,
	id,
}: InlineLanguageNameInputProps) => {
	const [inlineLanguageNameInput, setInlineLanguageNameInput] = useState(name);
	const [showInlineLanguageNameInput, setShowInlineLanguageNameInput] =
		useState(false);

	const activeLanguage = useEditorSettingsStore(
		(store) => store.selectedLanguage
	);
	const { setSelectedLanguage } = useEditorSettingsActions();

	const trpcUtils = trpc.useContext();
	const apiChangeLanguageName = trpc.dictionary.language.changeName.useMutation(
		{
			onSuccess() {
				trpcUtils.dictionary.language.getAll.invalidate();
			},
		}
	);

	const changeLanguageName = useCallback(() => {
		if (inlineLanguageNameInput) {
			apiChangeLanguageName.mutate({
				id,
				name: inlineLanguageNameInput.trim(),
			});
			if (activeLanguage.id === id) {
				setSelectedLanguage({ id, name: inlineLanguageNameInput.trim() });
			}
		}
		setShowInlineLanguageNameInput(false);
	}, [
		activeLanguage.id,
		apiChangeLanguageName,
		id,
		inlineLanguageNameInput,
		setSelectedLanguage,
	]);

	const handleInlineLanguageNameInputKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				changeLanguageName();
			}
		},
		[changeLanguageName]
	);

	const showLanguageInlineInput = useCallback(
		(name: string) => () => {
			setInlineLanguageNameInput(name);
			setShowInlineLanguageNameInput(true);
		},
		[]
	);

	return (
		<Box>
			{!showInlineLanguageNameInput && (
				<Box display="flex" gap="4" pl="9" alignItems="center">
					<Text color="text.400" w="80px">
						Name
					</Text>
					<Text color="text.500">{name}</Text>
					<IconButton
						ml="auto"
						variant="ghost"
						aria-label="edit"
						icon={<RxPencil1 />}
						onClick={showLanguageInlineInput(name)}
					/>
				</Box>
			)}
			{showInlineLanguageNameInput && (
				<Box display="flex" w="full" alignItems="center" gap="4" pl="9">
					<Text color="text.400" w="80px">
						Name
					</Text>
					<Input
						value={inlineLanguageNameInput}
						onChange={(e) => setInlineLanguageNameInput(e.target.value)}
						onKeyDown={handleInlineLanguageNameInputKeyDown}
						autoFocus
					/>
					<ButtonGroup isAttached>
						<IconButton
							variant="outline"
							aria-label="save"
							icon={<IoSaveOutline />}
							onClick={changeLanguageName}
						/>
						<IconButton
							variant="outline"
							aria-label="save"
							icon={<IoClose />}
							onClick={() => setShowInlineLanguageNameInput(false)}
						/>
					</ButtonGroup>
				</Box>
			)}
		</Box>
	);
};

type LookupSourceListType = {
	lookupSources: Exclude<
		RouterTypes["dictionary"]["language"]["getAll"],
		undefined
	>["output"][number]["lookupSources"];
};
const LookupSourceList = ({ lookupSources }: LookupSourceListType) => {
	const { isOpen, onOpen, onClose } = useDisclosure({});
	const cancelRef = useRef(null);

	const trpcUtils = trpc.useContext();
	const apiRemoveLookupSource =
		trpc.dictionary.language.removeLookupSource.useMutation({
			onSuccess() {
				trpcUtils.dictionary.language.getAll.invalidate();
			},
		});
	const apiChangeLookupSource =
		trpc.dictionary.language.changeLookupSource.useMutation({
			onSuccess() {
				trpcUtils.dictionary.language.getAll.invalidate();
			},
		});

	const itemToDelete = useRef<string | null>(null);
	const [editingItemId, setEditingItemId] = useState<null | string>(null);
	const [loSourceNameInput, setLoSourceNameInput] = useState("");
	const [loSourceUrlInput, setLoSourceUrlInput] = useState("");

	const confirmRemoveLookupSource = useCallback(
		(id: string) => {
			itemToDelete.current = id;
			onOpen();
		},
		[onOpen]
	);

	const removeLookupSource = useCallback(() => {
		if (itemToDelete.current) {
			apiRemoveLookupSource.mutate({ id: itemToDelete.current });
		}
		itemToDelete.current = null;
		onClose();
	}, [apiRemoveLookupSource, onClose]);

	const changeLookupSource = useCallback(() => {
		if (loSourceNameInput && loSourceNameInput && editingItemId) {
			apiChangeLookupSource.mutate({
				id: editingItemId,
				name: loSourceNameInput.trim(),
				url: loSourceUrlInput.trim(),
			});
		}
		setLoSourceNameInput("");
		setLoSourceUrlInput("");
		setEditingItemId(null);
	}, [
		apiChangeLookupSource,
		editingItemId,
		loSourceNameInput,
		loSourceUrlInput,
	]);

	const handleUrlInputKeyDown = useCallback(
		() => (e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				changeLookupSource();
			}
		},
		[changeLookupSource]
	);

	const showInlineSourceEditor = useCallback(
		({ id, name, url }: { id: string; name: string; url: string }) => {
			setLoSourceNameInput(name);
			setLoSourceUrlInput(url);
			setEditingItemId(id);
		},
		[]
	);

	return (
		<>
			<AlertDialog
				isOpen={isOpen}
				leastDestructiveRef={cancelRef}
				onClose={onClose}
				isCentered
			>
				<AlertDialogOverlay>
					<AlertDialogContent>
						<AlertDialogHeader fontSize="lg" fontWeight="bold">
							Delete Lookup Source
						</AlertDialogHeader>

						<AlertDialogBody>
							Are you sure? You can&apos;t undo this action afterwards.
						</AlertDialogBody>

						<AlertDialogFooter>
							<Button ref={cancelRef} onClick={onClose}>
								Cancel
							</Button>
							<Button colorScheme="red" onClick={removeLookupSource} ml={3}>
								Delete
							</Button>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialogOverlay>
			</AlertDialog>
			<List pl="9">
				{lookupSources.map((lookupSource) => {
					return editingItemId === lookupSource.id ? (
						<ListItem
							key={lookupSource.id}
							display="flex"
							alignItems="center"
							gap="4"
							h="50px"
						>
							<Input
								colorScheme="brand"
								color="text.400"
								w="150px"
								placeholder="Name"
								onChange={(e) => setLoSourceNameInput(e.target.value)}
								value={loSourceNameInput}
								autoFocus
							/>
							<Input
								w="100%"
								color="text.500"
								flexGrow="1"
								placeholder="URL"
								onChange={(e) => setLoSourceUrlInput(e.target.value)}
								value={loSourceUrlInput}
								onKeyDown={handleUrlInputKeyDown}
							/>
							<Box marginLeft="auto">
								<ButtonGroup isAttached>
									<IconButton
										icon={<IoSaveOutline />}
										aria-label="edit"
										variant="outline"
										onClick={changeLookupSource}
									/>
									<IconButton
										icon={<IoClose />}
										aria-label="edit"
										variant="outline"
										onClick={() => setEditingItemId(null)}
									/>
								</ButtonGroup>
							</Box>
						</ListItem>
					) : (
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
										onClick={() =>
											showInlineSourceEditor({
												id: lookupSource.id,
												name: lookupSource.name,
												url: lookupSource.url,
											})
										}
									/>
									<IconButton
										icon={<IoTrashBin />}
										aria-label="edit"
										color="red"
										variant="ghost"
										onClick={() => confirmRemoveLookupSource(lookupSource.id)}
									/>
								</ButtonGroup>
							</Box>
						</ListItem>
					);
				})}
			</List>
		</>
	);
};

type LookupSourceSectionType = {
	languageId: string;
	lookupSources: Exclude<
		RouterTypes["dictionary"]["language"]["getAll"],
		undefined
	>["output"][number]["lookupSources"];
};
const LookupSourceSection = ({
	languageId,
	lookupSources,
}: LookupSourceSectionType) => {
	const trpcUtils = trpc.useContext();
	const apiAddLookupSource =
		trpc.dictionary.language.addLookupSource.useMutation({
			onSuccess() {
				trpcUtils.dictionary.language.getAll.invalidate();
			},
		});

	const [showLoSourceInput, setShowLoSourceInput] = useState(false);

	const [loSourceNameInput, setLoSourceNameInput] = useState("");
	const [loSourceUrlInput, setLoSourceUrlInput] = useState("");

	const addLookupSource = useCallback(() => {
		if (loSourceNameInput && loSourceNameInput) {
			apiAddLookupSource.mutate({
				languageId,
				sourceName: loSourceNameInput.trim(),
				sourceUrl: loSourceUrlInput.trim(),
			});
		}
		setLoSourceNameInput("");
		setLoSourceUrlInput("");
		setShowLoSourceInput(false);
	}, [apiAddLookupSource, languageId, loSourceNameInput, loSourceUrlInput]);

	const handleUrlInputKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				addLookupSource();
			}
		},
		[addLookupSource]
	);

	return (
		<Box>
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
					onClick={() => setShowLoSourceInput(true)}
				/>
			</Box>
			<LookupSourceList lookupSources={lookupSources} />
			{showLoSourceInput && (
				<Box display="flex" alignItems="center" gap="4" h="50px">
					<Input
						colorScheme="brand"
						color="text.400"
						w="150px"
						placeholder="Name"
						value={loSourceNameInput}
						onChange={(e) => setLoSourceNameInput(e.target.value)}
						autoFocus
					/>
					<Input
						w="100%"
						color="text.500"
						flexGrow="1"
						placeholder="URL"
						onChange={(e) => setLoSourceUrlInput(e.target.value)}
						value={loSourceUrlInput}
						onKeyDown={handleUrlInputKeyDown}
					/>
					<Box marginLeft="auto">
						<ButtonGroup isAttached>
							<IconButton
								icon={<IoSaveOutline />}
								aria-label="edit"
								variant="outline"
								onClick={() => addLookupSource()}
							/>
							<IconButton
								icon={<IoClose />}
								aria-label="edit"
								variant="outline"
								onClick={() => setShowLoSourceInput(false)}
							/>
						</ButtonGroup>
					</Box>
				</Box>
			)}
		</Box>
	);
};

const SettingsPage: NextPageWithLayout = () => {
	const [iconInactive, iconActive] = useToken("colors", [
		"text.300",
		"brand.500",
	]);

	const toast = useToast();

	const [languageNameInput, setLanguageNameInput] = useState("");
	const [showLanguageNameInput, setShowLanguageNameInput] = useState(false);

	const { data: session } = useSession();
	const trpcUtils = trpc.useContext();

	const activeLanguage = useEditorSettingsStore(
		(store) => store.selectedLanguage
	);
	const { setSelectedLanguage } = useEditorSettingsActions();

	const userStats = trpc.user.stats.useQuery();

	const allLanguages = trpc.dictionary.language.getAll.useQuery();
	const apiAddLanguage = trpc.dictionary.language.add.useMutation({
		onSuccess() {
			trpcUtils.dictionary.language.getAll.invalidate();
		},
	});
	const apiRemoveLanguage = trpc.dictionary.language.remove.useMutation({
		onSuccess() {
			trpcUtils.dictionary.language.getAll.invalidate();
		},
	});

	const isLoading = apiAddLanguage.isLoading || allLanguages.isLoading;

	const itemToDelete = useRef<string | null>(null);
	const { isOpen, onOpen, onClose } = useDisclosure({});
	const cancelRef = useRef(null);

	const confirmRemoveLanguage = useCallback(
		(id: string) => {
			itemToDelete.current = id;
			onOpen();
		},
		[onOpen]
	);

	const removeLanguage = useCallback(() => {
		const itemToDeleteId = itemToDelete.current;
		if (itemToDeleteId) {
			apiRemoveLanguage.mutate({ id: itemToDeleteId });
			if (itemToDeleteId === activeLanguage.id) {
				const firstOtherLanguage = allLanguages.data?.find(
					(lang) => lang.id !== itemToDeleteId
				);
				if (firstOtherLanguage) {
					setSelectedLanguage({
						id: firstOtherLanguage.id,
						name: firstOtherLanguage.name,
					});
				}
			}
		}
		onClose();
		itemToDelete.current = null;
	}, [
		activeLanguage.id,
		allLanguages.data,
		apiRemoveLanguage,
		onClose,
		setSelectedLanguage,
	]);

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
		<>
			<AlertDialog
				isOpen={isOpen}
				leastDestructiveRef={cancelRef}
				onClose={onClose}
				isCentered
			>
				<AlertDialogOverlay>
					<AlertDialogContent>
						<AlertDialogHeader fontSize="lg" fontWeight="bold">
							Delete Language
						</AlertDialogHeader>

						<AlertDialogBody>
							Are you sure? You can&apos;t undo this action afterwards. All
							related Words / Sentences and Documents will be deleted
							permanently!
						</AlertDialogBody>

						<AlertDialogFooter>
							<Button ref={cancelRef} onClick={onClose}>
								Cancel
							</Button>
							<Button colorScheme="red" onClick={removeLanguage} ml={3}>
								Delete
							</Button>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialogOverlay>
			</AlertDialog>
			<Box
				display="flex"
				flexDir="column"
				px={[6, 8, 12]}
				py={2}
				maxH="100vh"
				overflow="auto"
				pos="relative"
			>
				<Box as="section" px={["6", null, "6rem"]} pt="2rem">
					<Box
						display="flex"
						gap={[4, null, 12]}
						alignItems="center"
						flexDir={["column", null, "row"]}
					>
						<Box display="flex" gap="4">
							<Avatar
								referrerPolicy="no-referrer"
								bg="text.100"
								name={session.user?.name || "unkown"}
								src={session.user?.image || undefined}
								size="xl"
							/>
							<Box>
								<Box
									display="flex"
									gap="1"
									alignItems="center"
									justifyContent="center"
								>
									<Text color="text.500" fontSize="2rem">
										{session.user?.name}
									</Text>
								</Box>
								<Box display="flex" gap="1" alignItems="center">
									<IoMailOutline color={iconActive} />
									<Text color="text.400">{session.user?.email}</Text>
								</Box>
							</Box>
						</Box>
						<StatGroup w={["100%", null, "500px"]}>
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
							<Stat>
								<StatLabel>Active Language</StatLabel>
								<Select
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
						<Card>
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
															{`${
																userStats.data?.byLanguageMap[language.id]
																	?.documents || 0
															}
															Documents, ${userStats.data?.byLanguageMap[language.id]?.words || 0} Words`}
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
												<InlineLanguageNameInput
													name={language.name}
													id={language.id}
												/>
												<LookupSourceSection
													languageId={language.id}
													lookupSources={language.lookupSources}
												/>
												{allLanguages.data.length > 1 && (
													<Box
														w="100%"
														ml="auto"
														display="flex"
														justifyContent="flex-end"
													>
														<IconButton
															variant="ghost"
															aria-label="delete language"
															icon={<IoTrashBin />}
															color="red"
															onClick={() => confirmRemoveLanguage(language.id)}
														/>
													</Box>
												)}
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
					<Box
						display="flex"
						alignItems="flex-end"
						justifyContent="flex-end"
						pt={4}
					>
						<Button
							variant="solid"
							colorScheme="red"
							onClick={() => signOut()}
							rightIcon={<IoLogOut />}
							aria-label="Logout"
						>
							Sign out
						</Button>
					</Box>
				</SkeletonText>
			</Box>
		</>
	);
};

SettingsPage.getLayout = function getLayout(page: ReactElement) {
	return <Layout>{page}</Layout>;
};

export const getServerSideProps = async (
	context: GetServerSidePropsContext
) => {
	return protectPage(context);
};

export default SettingsPage;
