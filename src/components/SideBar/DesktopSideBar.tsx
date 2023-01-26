import { Box } from "@chakra-ui/react";
import { useState } from "react";
import SideBar from "./SideBar";

const DesktopSideBar = () => {
	const [sideBarOpen, setSideBarOpen] = useState(false);

	return (
		<Box
			transition="150ms width ease-out"
			height="100vh"
			bg="#fafaf9"
			w={sideBarOpen ? "300px" : "62px"}
			display={["none", null, "flex"]}
			flexDir="column"
			borderRight="1px solid #E7E7E7"
			boxShadow="0px 0px 2px 2px rgba(0, 0, 0, 0.10);"
			zIndex="30"
			pos="relative"
			py={1}
			px={sideBarOpen ? 3 : 1}
			alignItems="center"
		>
			<SideBar sideBarOpen={sideBarOpen} setSideBarOpen={setSideBarOpen} />
		</Box>
	);
};

export default DesktopSideBar;
