import type { ReactElement } from "react";
import React, { useCallback } from "react";

import type { GetServerSidePropsContext } from "next";

import { Box } from "@chakra-ui/react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

const Editor = dynamic(() => import("../../../components/Editor/Editor"), {
	ssr: false,
});

import Layout from "@components/Layout";
import useEditorSettingsStore from "@store/store";
import protectPage from "@utils/protectPage";
import { useState } from "react";
import { IoDocumentOutline } from "react-icons/io5";

const EditorPage = () => {
	const router = useRouter();
	const { id: routerId } = router.query;
	const id = Array.isArray(routerId) ? routerId[0] : routerId;
	const [showScrollTopElement, setShowScrollTopElement] = useState(false);

	const editorBackgroundOpacity = useEditorSettingsStore(
		(state) => state.editorBackgroundOpacity
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

	const handleScroll = useCallback(
		(e: React.UIEvent<HTMLDivElement, UIEvent>) => {
			if (e.currentTarget.scrollTop > 100 && !showScrollTopElement) {
				setShowScrollTopElement(true);
			} else if (e.currentTarget.scrollTop < 100 && showScrollTopElement) {
				setShowScrollTopElement(false);
			}
		},
		[showScrollTopElement]
	);

	return (
		<Box display="flex">
			<Box
				bgSize="20px 20px"
				bgImage={`linear-gradient(to right, rgba(52, 73, 102, ${bgOpacity}) 1px, transparent 1px), linear-gradient(to bottom, rgba(52, 73, 102, ${bgOpacity}) 1px, transparent 1px); `}
				minH="100vh"
				display="flex"
				maxH="100vh"
				w="100%"
				flexDir="column"
				pos="relative"
				ref={onRootRef}
				onScroll={handleScroll}
				sx={{
					// msOverflowStyle: "none",
					// scrollbarWidth: {
					// 	base: "default",
					// 	md: "none",
					// },
					overflowY: "scroll",
					// "&::-webkit-scrollbar": {
					// 	display: { base: "default", md: "none" },
					// },

					"&::-webkit-scrollbar": {
						width: "8px",
						height: "8px",
						backgroundColor: "white",
					},

					"&::-webkit-scrollbar-thumb": {
						background: "text.100",
						borderRadius: "3px",
					},
				}}
			>
				<Box
					bg="rgba(255, 255, 255, 0.9)"
					py={4}
					top="0"
					zIndex="20"
					pos="sticky"
					boxShadow={
						showScrollTopElement
							? "0 1px 3px 0 rgba(0, 0, 0, 0.1),0 1px 2px 0 rgba(0, 0, 0, 0.06);"
							: "none"
					}
				>
					<Box display="flex" gap="12px" alignItems="center" h="22px" pl={12}>
						{showScrollTopElement && (
							<>
								<Box w="18px" h="18px" display={["none", "block"]}>
									<IoDocumentOutline color="#696F80" />
								</Box>
								<Box
									fontSize="0.9em"
									fontWeight="semibold"
									as="span"
									color="text.500"
									textOverflow="ellipsis"
									whiteSpace="nowrap"
									overflow="hidden"
								>
									{documentTitle}
								</Box>
							</>
						)}
					</Box>
				</Box>
				<Box
					display="grid"
					alignItems="start"
					justifyContent="center"
					gridTemplateColumns={[
						"0px minmax(400px, 800px) 0px",
						null,
						null,
						"1fr minmax(400px, 800px) minmax(200px, 1fr)",
					]}
				>
					<div />
					<Box fontFamily="'Source Sans 3', 'Noto Sans SC', 'Noto Sans JP'">
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
					<Box
						flexGrow="1"
						bg="yellow.100"
						alignItems="center"
						justifyContent="center"
						display={["none", null, null, "flex"]}
					>
						<Box
							pos="fixed"
							w="100px"
							h="100px"
							mt="200px"
							mr={{
								base: "0rem",
							}}
							ref={onSidebarPortalRef}
						/>
					</Box>
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
