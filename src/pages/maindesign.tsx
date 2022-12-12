import { Box, Button, IconButton } from "@chakra-ui/react";
import Editor from "@components/Editor/Editor";
import { useState } from "react";
import {
	IoHomeOutline,
	IoLibraryOutline,
	IoLanguageOutline,
	IoDocumentOutline,
	IoPricetagsOutline,
	IoAdd,
} from "react-icons/io5";

const MainDesign = () => {
	const [rootAnchorElem, setRootAnchorElem] = useState<HTMLDivElement | null>(
		null
	);

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
				w="72px"
				display="flex"
				flexDir="column"
				alignItems="center"
				borderRight="1px solid #E7E7E7"
				boxShadow="0px 0px 2px 2px rgba(0, 0, 0, 0.10);"
				zIndex="10"
			>
				<Box fontSize="60" fontWeight="600" color="#344966" userSelect="none">
					Y
				</Box>
				<Button
					bg="#344966"
					color="#FFFFFF"
					w="58px"
					h="52px"
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
				<IconButton
					w="58px"
					h="56px"
					icon={
						<IoHomeOutline
							color="#344966"
							style={{
								width: "26px",
								height: "26px",
							}}
						/>
					}
					variant="ghost"
					aria-label="home"
				/>
				<IconButton
					w="58px"
					h="56px"
					icon={
						<IoLibraryOutline
							color="#8F93A3"
							style={{
								width: "26px",
								height: "26px",
							}}
						/>
					}
					variant="ghost"
					aria-label="home"
				/>
				<IconButton
					w="58px"
					h="56px"
					icon={
						<IoLanguageOutline
							color="#8F93A3"
							style={{
								width: "26px",
								height: "26px",
							}}
						/>
					}
					variant="ghost"
					aria-label="home"
				/>
			</Box>
			<Box
				w="100%"
				bgSize="20px 20px"
				bgImage="linear-gradient(to right, rgba(52, 73, 102, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(52, 73, 102, 0.02) 1px, transparent 1px);"
				display="flex"
				flexDir="column"
				maxH="100vh"
				overflow="auto"
				ref={onRootRef}
			>
				<Box
					h="100px"
					bg="rgba(255, 255, 255, 0.9)"
					py={4}
					px={16}
					top="0"
					zIndex="20"
					pos="sticky"
					w="100%"
					boxShadow="0px 1px 12px rgba(0, 0, 0, 0.05)"
				>
					<Box display="flex" gap="12px" fontSize="20px" alignItems="center">
						<IoDocumentOutline
							color="#696F80"
							style={{ width: "24px", height: "24px" }}
						/>
						<Box as="span" color="#696F80">
							Japanese
						</Box>
						<Box as="span" color="#BDBDBD" userSelect="none">
							/
						</Box>
						<Box as="span" color="#696F80">
							ノーベル平和賞 授賞式始まる 平和や人権へのメッセージに注目
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
							style={{ width: "20px", height: "20px" }}
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
								icon={<IoAdd />}
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
				<Box
					display="flex"
					justifyContent="center"
					alignItems="center"
					flexDir="column"
				>
					<Box w="800px">
						<Editor scrollAnchor={rootAnchorElem || undefined} />
					</Box>
				</Box>
			</Box>
			<Box
				w="100px"
				h="100px"
				pos="absolute"
				bg="red"
				right="100px"
				top="100px"
			/>
		</Box>
	);
};

export default MainDesign;
