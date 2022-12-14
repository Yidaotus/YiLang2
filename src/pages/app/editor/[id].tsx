import type { ReactElement } from "react";

import type { GetServerSidePropsContext } from "next";

import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { Box, IconButton } from "@chakra-ui/react";

const Editor = dynamic(() => import("../../../components/Editor/Editor"), {
	ssr: false,
});

import { useState } from "react";
import { IoDocumentOutline, IoPricetagsOutline } from "react-icons/io5";
import Layout from "@components/Layout";
import useEditorStore from "@store/store";
import protectPage from "@utils/protectPage";
import shallow from "zustand/shallow";

const EditorPage = () => {
	const router = useRouter();
	const { id: routerId } = router.query;
	const id = Array.isArray(routerId) ? routerId[0] : routerId;

	const { editorBackgroundOpacity, selectedLanguage } = useEditorStore(
		(state) => ({
			editorBackgroundOpacity: state.editorBackgroundOpacity,
			selectedLanguage: state.selectedLanguage,
		}),
		shallow
	);

	const [sidebarPortalElem, setSidebarPortalElem] =
		useState<HTMLDivElement | null>(null);
	const [rootAnchorElem, setRootAnchorElem] = useState<HTMLDivElement | null>(
		null
	);
	const [documentTitle, setDocumentTitle] = useState("");
	const onSidebarPortalRef = (_sidebarElem: HTMLDivElement) => {
		if (_sidebarElem !== null) {
			setSidebarPortalElem(_sidebarElem);
		}
	};
	const onRootRef = (_rootAnchorElem: HTMLDivElement) => {
		if (_rootAnchorElem !== null) {
			setRootAnchorElem(_rootAnchorElem);
		}
	};

	const bgOpacity = ((editorBackgroundOpacity + 20) / 100) * 0.05;

	return (
		<Box display="flex">
			<Box
				w="100%"
				bgSize="20px 20px"
				bgImage={`linear-gradient(to right, rgba(52, 73, 102, ${bgOpacity}) 1px, transparent 1px), linear-gradient(to bottom, rgba(52, 73, 102, ${bgOpacity}) 1px, transparent 1px); `}
				minH="100vh"
				display="flex"
				flexDir="column"
				maxH="100vh"
				overflow="auto"
				pos="relative"
				ref={onRootRef}
				sx={{
					msOverflowStyle: "none",
					scrollbarWidth: {
						base: "default",
						md: "none",
					},
					overflowY: "scroll",
					"&::-webkit-scrollbar": {
						display: { base: "default", md: "none" },
					},
				}}
			>
				<Box
					bg="rgba(255, 255, 255, 0.9)"
					py={4}
					px={[4, 16]}
					top="0"
					zIndex="20"
					pos={["static", null, "sticky"]}
					w="100%"
					boxShadow="0px 1px 12px rgba(0, 0, 0, 0.05)"
				>
					<Box display="flex" gap="12px" fontSize="20px" alignItems="center">
						<IoDocumentOutline
							color="#696F80"
							style={{ minWidth: "22px", height: "22px" }}
						/>
						<Box
							as="span"
							color="#696F80"
							textOverflow="ellipsis"
							whiteSpace="nowrap"
							overflow="hidden"
						>
							{documentTitle}
						</Box>
					</Box>
				</Box>
				<Box display="flex" alignItems="center" justifyContent="center">
					<Box
						w={["100%", null, "800px"]}
						px={[4, 4, 0]}
						pt="2rem"
						pb="4rem"
						fontFamily="'Source Sans 3', 'Noto Sans SC', 'Noto Sans JP'"
					>
						{id && (
							<Editor
								scrollAnchor={rootAnchorElem || undefined}
								sidebarPortal={sidebarPortalElem || undefined}
								setDocumentTitle={setDocumentTitle}
								documentId={id}
							/>
						)}
						{!id && <Box>Something went wrong, no document ID specified!</Box>}
					</Box>
				</Box>
			</Box>
			<Box display={["none", null, "flex"]} pl="60px" pos="absolute" w="100%">
				<Box flexGrow="1" bg="yellow.100" flexShrink="0" />
				<Box w="800px" />
				<Box
					flexGrow="1"
					bg="yellow.100"
					display="flex"
					alignItems="center"
					justifyContent="center"
				>
					<Box
						w="100px"
						h="100px"
						pos="absolute"
						mt="400px"
						mr={{
							base: "0rem",
						}}
						ref={onSidebarPortalRef}
					/>
				</Box>
			</Box>
		</Box>
	);
};

EditorPage.getLayout = function getLayout(page: ReactElement) {
	return <Layout>{page}</Layout>;
};

export const getServerSideProps = async (
	context: GetServerSidePropsContext
) => {
	return protectPage(context);
};

export default EditorPage;
