import {
	Avatar,
	Box,
	Button,
	IconButton,
	Text,
	useToken,
} from "@chakra-ui/react";
import SearchIcon from "@components/icons/search";
import UniversalSearchInput from "@components/UniversalSearchInput";
import useEditorSettingsStore from "@store/store";
import { trpc } from "@utils/trpc";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useCallback } from "react";
import {
	IoChevronBack,
	IoChevronForward,
	IoHomeOutline,
	IoLanguageOutline,
	IoLibraryOutline,
} from "react-icons/io5";
import SideBarButton from "./SideBarButton";

type SideBarProps = {
	sideBarOpen: boolean;
	setSideBarOpen: (open: boolean) => void;
	closeOnRouteChange?: boolean;
};
const SideBar = ({
	sideBarOpen,
	setSideBarOpen,
	closeOnRouteChange = false,
}: SideBarProps) => {
	const { data: session } = useSession();
	const router = useRouter();
	const activeRoute = router.pathname.split("/").pop();
	const [iconInactive, iconActive] = useToken("colors", [
		"text.300",
		"brand.500",
	]);

	const selectedLanguage = useEditorSettingsStore(
		(store) => store.selectedLanguage
	);
	const apiCreateDocument = trpc.document.upsertDocument.useMutation();

	const navigateToRoute = useCallback(
		(url: string) => {
			router.push(url);
			if (closeOnRouteChange) {
				setSideBarOpen(false);
			}
		},
		[closeOnRouteChange, router, setSideBarOpen]
	);

	const createNewDocument = useCallback(async () => {
		const newDocumentId = await apiCreateDocument.mutateAsync({
			language: selectedLanguage.id,
		});
		navigateToRoute(`/app/editor/${newDocumentId.id}`);
	}, [apiCreateDocument, navigateToRoute, selectedLanguage.id]);

	const openHome = useCallback(() => {
		navigateToRoute("/app");
	}, [navigateToRoute]);

	const openSettings = useCallback(() => {
		navigateToRoute("/app/settings/");
	}, [navigateToRoute]);

	const openLibrary = useCallback(() => {
		navigateToRoute("/app/documents/");
	}, [navigateToRoute]);

	const openDictionary = useCallback(() => {
		navigateToRoute("/app/dictionary/");
	}, [navigateToRoute]);

	return (
		<Box display="flex" flexDir="column" alignItems="center" h="100%">
			<Box fontSize="60" fontWeight="600" color="#344966" userSelect="none">
				{sideBarOpen ? "YiLang" : "Y"}
			</Box>
			<Button
				bg="#344966"
				color="#FFFFFF"
				w="100%"
				h="48px"
				fontSize={sideBarOpen ? 20 : 36}
				fontWeight={sideBarOpen ? "400" : "500"}
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
				{sideBarOpen ? "New Document" : "+"}
			</Button>
			<Box h="24px" />
			{sideBarOpen ? (
				<UniversalSearchInput width="250px" bg="white" autoFocus />
			) : (
				<IconButton
					aria-label="open search"
					icon={
						<SearchIcon
							style={{
								fill: iconActive,
								width: "1.1rem",
								height: "1.1rem",
							}}
						/>
					}
					variant="link"
					onClick={() => setSideBarOpen(true)}
				/>
			)}
			<Box h="24px" />
			<Box
				display="flex"
				flexDir="column"
				gap="6px"
				h="100%"
				w="100%"
				alignItems={sideBarOpen ? "flex-start" : "center"}
			>
				<Text color="text.400" fontSize="0.9em" pl={2} h="24px">
					{sideBarOpen ? "Editor" : ""}
				</Text>
				<SideBarButton
					text="Home"
					routeId="app"
					activeRoute={activeRoute || ""}
					Icon={IoHomeOutline}
					onClick={openHome}
					sidebarOpen={sideBarOpen}
				/>
				<SideBarButton
					text="Documents"
					routeId="documents"
					activeRoute={activeRoute || ""}
					Icon={IoLibraryOutline}
					onClick={openLibrary}
					sidebarOpen={sideBarOpen}
				/>
				<SideBarButton
					text="Dictionary"
					routeId="dictionary"
					activeRoute={activeRoute || ""}
					Icon={IoLanguageOutline}
					onClick={openDictionary}
					sidebarOpen={sideBarOpen}
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
							{sideBarOpen && (
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
					{sideBarOpen ? (
						<IconButton
							w="100%"
							aria-label="close sidebar"
							icon={<IoChevronBack />}
							variant="link"
							onClick={() => setSideBarOpen(false)}
						/>
					) : (
						<IconButton
							w="100%"
							aria-label="open sidebar"
							icon={<IoChevronForward />}
							variant="link"
							onClick={() => setSideBarOpen(true)}
						/>
					)}
				</Box>
				<Box h="10px" />
			</Box>
		</Box>
	);
};

export default SideBar;
