import { Button, useToken } from "@chakra-ui/react";
import type { IconType } from "react-icons";

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
	const [iconActive, iconInactive, brand] = useToken("colors", [
		"text.200",
		"text.200",
		"brand.500",
	]);

	const isActive = activeRoute === routeId;

	return (
		<Button
			h="32px"
			w={sidebarOpen ? "100%" : "unset"}
			size="sm"
			fontWeight="normal"
			bg={isActive ? "brand.500" : "none"}
			color={isActive ? "text.100" : "text.400"}
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

export default SideBarButton;
