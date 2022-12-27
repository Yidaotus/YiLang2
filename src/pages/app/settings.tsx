import type { NextPageWithLayout } from "pages/_app";
import type { ReactElement } from "react";
import { useRef } from "react";
import { useCallback, useState } from "react";

import Layout from "@components/Layout";
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
	SkeletonText,
	Stat,
	StatGroup,
	StatHelpText,
	StatLabel,
	StatNumber,
	Text,
	useDisclosure,
	useToken,
} from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import type { GetServerSidePropsContext } from "next";
import protectPage from "@utils/protectPage";
import type { Session } from "next-auth";
import {
	IoAdd,
	IoClose,
	IoDocumentOutline,
	IoLanguageOutline,
	IoMailOutline,
	IoSave,
	IoSaveOutline,
	IoSearchOutline,
	IoSettingsOutline,
	IoTrashBin,
} from "react-icons/io5";
import { RxPencil1 } from "react-icons/rx";
import type { RouterTypes } from "@utils/trpc";
import { trpc } from "@utils/trpc";
import useEditorStore from "@store/store";

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

	const trpcUtils = trpc.useContext();
	const apiChangeLanguageName = trpc.dictionary.changeLanguageName.useMutation({
		onSuccess() {
			trpcUtils.dictionary.getAllLanguages.invalidate();
		},
	});

	const changeLanguageName = useCallback(() => {
		if (inlineLanguageNameInput) {
			apiChangeLanguageName.mutate({
				id,
				name: inlineLanguageNameInput.trim(),
			});
		}
		setShowInlineLanguageNameInput(false);
	}, [apiChangeLanguageName, id, inlineLanguageNameInput]);

	const handleInlineLanguageNameInputKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			console.debug({ id, key: e.key });
			if (e.key === "Enter") {
				changeLanguageName();
			}
		},
		[changeLanguageName, id]
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
		RouterTypes["dictionary"]["getAllLanguages"],
		undefined
	>["output"][number]["lookupSources"];
};
const LookupSourceList = ({ lookupSources }: LookupSourceListType) => {
	const { isOpen, onOpen, onClose } = useDisclosure({});
	const cancelRef = useRef(null);

	const trpcUtils = trpc.useContext();
	const apiRemoveLookupSource = trpc.dictionary.removeLookupSource.useMutation({
		onSuccess() {
			trpcUtils.dictionary.getAllLanguages.invalidate();
		},
	});
	const apiChangeLookupSource = trpc.dictionary.changeLookupSource.useMutation({
		onSuccess() {
			trpcUtils.dictionary.getAllLanguages.invalidate();
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
		RouterTypes["dictionary"]["getAllLanguages"],
		undefined
	>["output"][number]["lookupSources"];
};
const LookupSourceSection = ({
	languageId,
	lookupSources,
}: LookupSourceSectionType) => {
	const trpcUtils = trpc.useContext();
	const apiAddLookupSource = trpc.dictionary.addLookupSource.useMutation({
		onSuccess() {
			trpcUtils.dictionary.getAllLanguages.invalidate();
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

	const [languageNameInput, setLanguageNameInput] = useState("");
	const [showLanguageNameInput, setShowLanguageNameInput] = useState(false);

	const { data: session } = useSession();
	const trpcUtils = trpc.useContext();

	const activeLanguage = useEditorStore((store) => store.selectedLanguage);
	const setActiveLanguage = useEditorStore(
		(store) => store.setSelectedLanguage
	);

	const allLanguages = trpc.dictionary.getAllLanguages.useQuery();
	const apiAddLanguage = trpc.dictionary.addLanguage.useMutation({
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
					setActiveLanguage({
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
		setActiveLanguage,
	]);

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
			<Box display="flex" flexDir="column">
				<Box as="section" pl={["6", null, "6rem"]} pt="2rem">
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
