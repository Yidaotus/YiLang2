import {
	Avatar,
	Box,
	Button,
	IconButton,
	Spinner,
	Text,
	useToken,
} from "@chakra-ui/react";
import useEditorSettingsStore from "@store/store";
import { trpc } from "@utils/trpc";
import { signIn, useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import type { IconType } from "react-icons";
import {
	IoChevronBack,
	IoChevronForward,
	IoHomeOutline,
	IoLanguageOutline,
	IoLibraryOutline,
	IoSearch,
} from "react-icons/io5";
import UniversalSearchInput from "./UniversalSearchInput";

type SideBarButtonProps = {
	sidebarOpen: boolean;
	text: string;
	Icon: IconType;
	activeRoute: string;
	routeId: string;
	onClick: () => void;
};
const SideBarButton = ({
	sidebarOpen,
	text,
	Icon,
	activeRoute,
	routeId,
	onClick,
}: SideBarButtonProps) => {
	const [iconInactive, iconActive] = useToken("colors", [
		"text.400",
		"text.100",
	]);

	const isActive = activeRoute === routeId;

	return (
		<Button
			h="32px"
			w={sidebarOpen ? "100%" : "unset"}
			size="sm"
			fontWeight="normal"
			bg={isActive ? "brand.500" : "none"}
			color={isActive ? "text.100" : "text.500"}
			justifyContent="flex-start"
			sx={{
				"&:hover": {
					bg: isActive ? "brand.500" : "brand.50",
					color: isActive ? "text.100" : "text.500",
				},
				"& .chakra-button__icon": {
					marginRight: sidebarOpen ? 3 : 0,
				},
			}}
			leftIcon={
				<Icon
					color={isActive ? iconActive : iconInactive}
					style={{
						width: "18px",
						height: "18px",
					}}
				/>
			}
			variant="ghost"
			aria-label={text}
			onClick={onClick}
		>
			{sidebarOpen && text}
		</Button>
	);
};

type LayoutProps = {
	children: React.ReactNode;
};
const Layout = ({ children }: LayoutProps) => {
	const router = useRouter();
	const activeRoute = router.pathname.split("/").pop();
	const [isLoading, setIsLoading] = useState(false);
	const [iconInactive, iconActive] = useToken("colors", [
		"text.300",
		"brand.500",
	]);
	const [sidebarOpen, setSidebarOpen] = useState(false);

	const selectedLanguage = useEditorSettingsStore(
		(store) => store.selectedLanguage
	);
	const apiCreateDocument = trpc.document.upsertDocument.useMutation();

	const openHome = useCallback(() => {
		router.push("/app");
	}, [router]);
	const createNewDocument = useCallback(async () => {
		const newDocumentId = await apiCreateDocument.mutateAsync({
			language: selectedLanguage.id,
		});
		router.push(`/app/editor/${newDocumentId.id}`);
	}, [apiCreateDocument, router, selectedLanguage]);
	const openLibrary = useCallback(() => {
		router.push("/app/documents/");
	}, [router]);
	const openDictionary = useCallback(() => {
		router.push("/app/dictionary/");
	}, [router]);
	const openSettings = useCallback(() => {
		router.push("/app/settings/");
	}, [router]);

	const routerChangeStart = useCallback(() => {
		setIsLoading(true);
	}, []);

	const routerChangeFinish = useCallback(() => {
		setIsLoading(false);
	}, []);

	useEffect(() => {
		router.events.on("routeChangeStart", routerChangeStart);
		router.events.on("routeChangeComplete", routerChangeFinish);
		return () => {
			router.events.off("routeChangeStart", routerChangeStart);
			router.events.off("routeChangeComplete", routerChangeFinish);
		};
	});

	const { data: session } = useSession();

	return (
		<>
			<Head>
				<title>YiLang 2.0</title>
				<meta name="description" content="Generated by create-t3-app" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<Box as="main" display="flex" overflow="hidden" pos="relative">
				<Box
					transition="150ms width ease-out"
					height="100vh"
					bg="#fafaf9"
					w={sidebarOpen ? "300px" : "62px"}
					display={["none", null, "flex"]}
					flexDir="column"
					borderRight="1px solid #E7E7E7"
					boxShadow="0px 0px 2px 2px rgba(0, 0, 0, 0.10);"
					zIndex="30"
					pos="relative"
					py={1}
					px={sidebarOpen ? 3 : 1}
					alignItems="center"
				>
					<Box fontSize="60" fontWeight="600" color="#344966" userSelect="none">
						{sidebarOpen ? "YiLang" : "Y"}
					</Box>
					<Button
						bg="#344966"
						color="#FFFFFF"
						w="100%"
						h="48px"
						fontSize={sidebarOpen ? 20 : 36}
						fontWeight={sidebarOpen ? "400" : "500"}
						borderRadius={3}
						boxShadow="0px 2px 4px rgba(0, 0, 0, 0.25);"
						sx={{
							"&:hover": {
								bg: "#2A3A51",
								color: "#FFFFFF",
							},
						}}
						onClick={createNewDocument}
					>
						{sidebarOpen ? "New Document" : "+"}
					</Button>
					<Box h="24px" />
					{sidebarOpen ? (
						<UniversalSearchInput width="250px" bg="white" autoFocus />
					) : (
						<IconButton
							aria-label="open search"
							icon={<IoSearch />}
							variant="link"
							onClick={() => setSidebarOpen(true)}
						/>
					)}
					<Box h="24px" />
					<Box
						display="flex"
						flexDir="column"
						gap="6px"
						h="100%"
						w="100%"
						alignItems={sidebarOpen ? "flex-start" : "center"}
					>
						<Text color="text.400" fontSize="0.9em" pl={2} h="24px">
							{sidebarOpen ? "Editor" : ""}
						</Text>
						<SideBarButton
							text="Home"
							routeId="app"
							activeRoute={activeRoute || ""}
							Icon={IoHomeOutline}
							onClick={openHome}
							sidebarOpen={sidebarOpen}
						/>
						<SideBarButton
							text="Documents"
							routeId="documents"
							activeRoute={activeRoute || ""}
							Icon={IoLibraryOutline}
							onClick={openLibrary}
							sidebarOpen={sidebarOpen}
						/>
						<SideBarButton
							text="Dictionary"
							routeId="dictionary"
							activeRoute={activeRoute || ""}
							Icon={IoLanguageOutline}
							onClick={openDictionary}
							sidebarOpen={sidebarOpen}
						/>
						<Box mt="auto" />
						<Box borderTopColor="text.100" borderTopWidth="1px" w="100%" pt={3}>
							{!!session ? (
								<Box
									display="flex"
									alignItems="center"
									justifyContent="center"
									gap={2}
									w="100%"
								>
									<Avatar
										referrerPolicy="no-referrer"
										bg="text.100"
										name={session.user?.name || "unkown"}
										src={session.user?.image || undefined}
										_hover={{ cursor: "pointer" }}
										onClick={openSettings}
									/>
									{sidebarOpen && (
										<Box display="flex" flexDir="column">
											<Text fontSize="1.0rem" color="text.500">
												{session.user?.name || "unknown"}
											</Text>
											<Text fontSize="0.9rem" color="text.400">
												{session.user?.email || "unknown"}
											</Text>
										</Box>
									)}
								</Box>
							) : (
								<>
									Not signed in <br />
									<button onClick={() => signIn()}>Sign in</button>
								</>
							)}
						</Box>
						<Box
							borderTopColor="text.100"
							borderTopWidth="1px"
							w="100%"
							mt={2}
							pt={2}
						>
							{sidebarOpen ? (
								<IconButton
									w="100%"
									aria-label="close sidebar"
									icon={<IoChevronBack />}
									variant="link"
									onClick={() => setSidebarOpen(false)}
								/>
							) : (
								<IconButton
									w="100%"
									aria-label="open sidebar"
									icon={<IoChevronForward />}
									variant="link"
									onClick={() => setSidebarOpen(true)}
								/>
							)}
						</Box>
						<Box h="10px" />
					</Box>
				</Box>
				<Box w="100%">
					{isLoading && (
						<Box
							w="100%"
							h="100%"
							bg="rgba(0,0,0,0.4)"
							display="flex"
							alignItems="center"
							justifyContent="center"
							pos="absolute"
							top="0"
							zIndex={50}
						>
							<Spinner color="brand.500" w="150px" h="150px" />
						</Box>
					)}
					{children}
				</Box>
			</Box>
		</>
	);
};

export default Layout;
