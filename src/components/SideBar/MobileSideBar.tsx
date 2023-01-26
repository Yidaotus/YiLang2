import {
	Drawer,
	DrawerBody,
	DrawerCloseButton,
	DrawerContent,
	DrawerOverlay,
	IconButton,
	useToken,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { IoMenuOutline } from "react-icons/io5";
import SideBar from "./SideBar";

const MobileSideBar = () => {
	const [iconColor] = useToken("colors", ["text.300"]);
	const [sideBarOpen, setSideBarOpen] = useState(false);
	const btnRef = useRef(null);

	return (
		<>
			<IconButton
				aria-label="open menu"
				icon={<IoMenuOutline color={iconColor} />}
				ref={btnRef}
				variant="ghost"
				onClick={() => setSideBarOpen(true)}
				position="fixed"
				top="5px"
				left="5px"
				zIndex={50}
			/>
			<Drawer
				isOpen={sideBarOpen}
				placement="left"
				onClose={() => setSideBarOpen(false)}
				finalFocusRef={btnRef}
			>
				<DrawerOverlay />
				<DrawerContent>
					<DrawerCloseButton />
					<DrawerBody>
						<SideBar
							sideBarOpen={sideBarOpen}
							setSideBarOpen={setSideBarOpen}
						/>
					</DrawerBody>
				</DrawerContent>
			</Drawer>
		</>
	);
};

export default MobileSideBar;
