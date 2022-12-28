import {
	Avatar,
	Box,
	Button,
	IconButton,
	Spinner,
	useToken,
} from "@chakra-ui/react";
import useEditorStore from "@store/store";
import { trpc } from "@utils/trpc";
import { signIn, useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import {
	IoHomeOutline,
	IoLibraryOutline,
	IoLanguageOutline,
	IoChevronBack,
	IoChevronForward,
} from "react-icons/io5";

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

	const selectedLanguage = useEditorStore((store) => store.selectedLanguage);
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
				<title>Create T3 App</title>
				<meta name="description" content="Generated by create-t3-app" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<Box as="main" display="flex" overflow="hidden" pos="relative">
				<Box
					transition="150ms width ease-out"
					height="100vh"
					bg="#fafaf9"
					w={sidebarOpen ? "300px" : "62px"}
					display={["none", "flex"]}
					flexDir="column"
					borderRight="1px solid #E7E7E7"
					boxShadow="0px 0px 2px 2px rgba(0, 0, 0, 0.10);"
					zIndex="30"
					pos="relative"
					py={1}
					px={sidebarOpen ? 3 : 1}
					alignItems="center"
				>
					<IconButton
						color={iconInactive}
						pos="absolute"
						variant="link"
						top="20px"
						right={sidebarOpen ? "10px" : "-40px"}
						zIndex={50}
						icon={
							sidebarOpen ? (
								<IoChevronBack size={26} />
							) : (
								<IoChevronForward size={26} />
							)
						}
						aria-label="Open Sidebar"
						onClick={() => setSidebarOpen(!sidebarOpen)}
					/>
					<Box fontSize="60" fontWeight="600" color="#344966" userSelect="none">
						Y
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
					<Box
						display="flex"
						flexDir="column"
						gap="4px"
						h="100%"
						alignItems={sidebarOpen ? "flex-start" : "center"}
					>
						<IconButton
							w="100%"
							h="48px"
							icon={
								<IoHomeOutline
									color={activeRoute === "editor" ? iconActive : iconInactive}
									style={{
										width: "22px",
										height: "22px",
									}}
								/>
							}
							variant="ghost"
							aria-label="home"
							onClick={openHome}
						/>
						<IconButton
							w="100%"
							h="48px"
							icon={
								<IoLibraryOutline
									color={
										activeRoute === "documents" ? iconActive : iconInactive
									}
									style={{
										width: "22px",
										height: "22px",
									}}
								/>
							}
							variant="ghost"
							aria-label="home"
							onClick={openLibrary}
						/>
						<IconButton
							w="100%"
							h="48px"
							icon={
								<IoLanguageOutline
									color={
										activeRoute === "dictionary" ? iconActive : iconInactive
									}
									style={{
										width: "22px",
										height: "22px",
									}}
								/>
							}
							variant="ghost"
							aria-label="home"
							onClick={openDictionary}
						/>

						{!!session ? (
							<>
								<Box mt="auto" />
								<Avatar
									referrerPolicy="no-referrer"
									bg="text.100"
									name={session.user?.name || "unkown"}
									src={session.user?.image || undefined}
									_hover={{ cursor: "pointer" }}
									onClick={openSettings}
								/>
							</>
						) : (
							<>
								<Box mt="auto" />
								Not signed in <br />
								<button onClick={() => signIn()}>Sign in</button>
							</>
						)}
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
