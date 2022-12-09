import {
	Avatar,
	Box,
	Button,
	Divider,
	IconButton,
	Text,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import type { MouseEventHandler } from "react";
import { useCallback, useState } from "react";
import {
	IoChevronBack,
	IoChevronForward,
	IoHome,
	IoLibrary,
	IoJournal,
	IoSettings,
} from "react-icons/io5";

type SideBarButtonProps = {
	icon: React.ReactElement;
	text: string;
	isCollapsed: boolean;
	onClick?: MouseEventHandler<HTMLButtonElement>;
};
const SideBarButton = ({
	isCollapsed,
	text,
	icon,
	onClick,
}: SideBarButtonProps) => (
	<Button
		justifyContent="flex-start"
		leftIcon={icon}
		pl={4}
		onClick={onClick}
		variant="solid"
		bg="#0D2B30"
		color="#FFFFFF"
		borderRadius="2px"
		sx={{
			"&:hover": {
				color: "#0D2B30",
				bg: "#FFFFFF",
			},
		}}
	>
		{!isCollapsed && text}
	</Button>
);

const SideBar = () => {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const router = useRouter();

	const toggleCollapsed = useCallback(() => {
		setIsCollapsed(!isCollapsed);
	}, [isCollapsed, setIsCollapsed]);

	return (
		<Box height="100%" position="relative" bg="gray.400" top={0} left={0}>
			{isCollapsed && (
				<Box position="absolute" left="70px" top="12px">
					<IconButton
						onClick={toggleCollapsed}
						icon={isCollapsed ? <IoChevronForward /> : <IoChevronBack />}
						aria-label="Collapse"
					/>
				</Box>
			)}
			<Box
				width={isCollapsed ? "58px" : "250px"}
				height="100vh"
				transitionTimingFunction="ease-out"
				transition="width 0.3s"
				overflow="hidden"
				display="flex"
				flexDir="column"
				top={0}
				position="sticky"
				bg="#0D2B30"
				color="#FFFFFF"
				boxShadow="1px 0px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
				py={4}
				px={1}
				gap={3}
			>
				<Box display="flex" gap={5} alignItems="center">
					<Avatar name="Dan Abrahmov" src="https://bit.ly/dan-abramov" />
					<Text fontSize="lg">Yidaoutus</Text>
					{!isCollapsed && (
						<Box marginLeft="auto">
							<SideBarButton
								onClick={toggleCollapsed}
								icon={isCollapsed ? <IoChevronForward /> : <IoChevronBack />}
								aria-label="Collapse"
								text=""
								isCollapsed={false}
							/>
						</Box>
					)}
				</Box>
				<Divider />
				<SideBarButton
					isCollapsed={isCollapsed}
					icon={<IoHome />}
					text="Home"
				/>
				<SideBarButton
					isCollapsed={isCollapsed}
					icon={<IoLibrary />}
					text="Documents"
					onClick={() => router.push("/app/documents")}
				/>
				<SideBarButton
					isCollapsed={isCollapsed}
					icon={<IoJournal />}
					text="Dictionary"
					onClick={() => router.push("/app/dictionary")}
				/>
				<Box marginTop="auto" />
				<Divider />
				<SideBarButton
					isCollapsed={isCollapsed}
					icon={<IoSettings />}
					text="Settings"
				/>
			</Box>
		</Box>
	);
};

export default SideBar;
