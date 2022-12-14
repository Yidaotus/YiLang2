import { Box, Button, IconButton } from "@chakra-ui/react";
import Editor from "@components/Editor/Editor";
import { $isHeadingNode } from "@lexical/rich-text";
import { useCallback, useEffect, useState } from "react";
import {
	IoHomeOutline,
	IoLibraryOutline,
	IoLanguageOutline,
	IoDocumentOutline,
	IoPricetagsOutline,
	IoAdd,
} from "react-icons/io5";
import { $getRoot } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

const MainDesign = () => {
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

	return (
		<Box display="flex" overflow="hidden" pos="relative">
			<Box
				height="100vh"
				bg="#fafaf9"
				w="62px"
				display="flex"
				flexDir="column"
				alignItems="center"
				borderRight="1px solid #E7E7E7"
				boxShadow="0px 0px 2px 2px rgba(0, 0, 0, 0.10);"
				zIndex="30"
			>
				<Box fontSize="60" fontWeight="600" color="#344966" userSelect="none">
					Y
				</Box>
				<Button
					bg="#344966"
					color="#FFFFFF"
					w="52px"
					h="48px"
					fontSize="36"
					fontWeight="500"
					borderRadius={3}
					boxShadow="0px 2px 4px rgba(0, 0, 0, 0.25);"
					sx={{
						"&:hover": {
							bg: "#2A3A51",
							color: "#FFFFFF",
						},
					}}
				>
					+
				</Button>
				<Box h="24px" />
				<Box display="flex" flexDir="column" gap="4px">
					<IconButton
						w="52px"
						h="48px"
						icon={
							<IoHomeOutline
								color="#344966"
								style={{
									width: "22px",
									height: "22px",
								}}
							/>
						}
						variant="ghost"
						aria-label="home"
					/>
					<IconButton
						w="52px"
						h="48px"
						icon={
							<IoLibraryOutline
								color="#8F93A3"
								style={{
									width: "22px",
									height: "22px",
								}}
							/>
						}
						variant="ghost"
						aria-label="home"
					/>
					<IconButton
						w="52px"
						h="48px"
						icon={
							<IoLanguageOutline
								color="#8F93A3"
								style={{
									width: "22px",
									height: "22px",
								}}
							/>
						}
						variant="ghost"
						aria-label="home"
					/>
				</Box>
			</Box>
			<Box
				w="100%"
				bgSize="20px 20px"
				bgImage="linear-gradient(to right, rgba(52, 73, 102, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(52, 73, 102, 0.02) 1px, transparent 1px);"
				display="flex"
				flexDir="column"
				maxH="100vh"
				overflow="auto"
				pos="relative"
				ref={onRootRef}
				sx={{
					"-ms-overflow-style": "none" /* for Internet Explorer, Edge */,
					"scrollbar-width": "none" /* for Firefox */,
					"overflow-y": "scroll",
					"&::-webkit-scrollbar": {
						display: "none",
					},
				}}
			>
				<Box
					bg="rgba(255, 255, 255, 0.9)"
					py={6}
					px={{ sm: 4, md: 16 }}
					top="0"
					zIndex="20"
					pos="sticky"
					w="100%"
					boxShadow="0px 1px 12px rgba(0, 0, 0, 0.05)"
				>
					<Box display="flex" gap="12px" fontSize="20px" alignItems="center">
						<IoDocumentOutline
							color="#696F80"
							style={{ minWidth: "22px", height: "22px" }}
						/>
						<Box as="span" color="#696F80">
							Japanese
						</Box>
						<Box as="span" color="#BDBDBD" userSelect="none">
							/
						</Box>
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
					<Box
						display="flex"
						gap="16px"
						fontSize="16px"
						alignItems="center"
						pt="7px"
					>
						<IoPricetagsOutline
							color="#696F80"
							style={{ minWidth: "20px", height: "20px" }}
						/>
						<Box display="flex" gap="12px">
							<Box
								as="span"
								color="#FFFFFF"
								borderRadius="4px"
								bg="#EE8041"
								px="6px"
							>
								news
							</Box>
							<Box
								as="span"
								color="#FFFFFF"
								borderRadius="4px"
								bg="#415DEE"
								px="6px"
							>
								intermediate
							</Box>
							<Box
								as="span"
								color="#FFFFFF"
								borderRadius="4px"
								bg="#55C560"
								px="6px"
							>
								formal
							</Box>
							<IconButton
								aria-label="Add a tag"
								icon={<span>+</span>}
								w="26px"
								minW="0px"
								h="26px"
								color="#696F80"
								fontWeight="semibold"
								borderRadius="4px"
								bg="#EAEAEA"
							/>
						</Box>
					</Box>
				</Box>
				<Box display="flex" alignItems="center" justifyContent="center">
					<Box
						w="800px"
						pt="2rem"
						pb="4rem"
						fontFamily="'Source Sans 3', 'Noto Sans JP'"
					>
						<Editor
							scrollAnchor={rootAnchorElem || undefined}
							sidebarPortal={sidebarPortalElem || undefined}
							setDocumentTitle={setDocumentTitle}
						/>
					</Box>
				</Box>
			</Box>
			<Box display="flex" pl="60px" pos="absolute" w="100%">
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

export default MainDesign;
