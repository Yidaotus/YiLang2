import { Box } from "@chakra-ui/react";
import SideBar from "@components/SideBar/SideBar";
import Head from "next/head";
import { useRouter } from "next/router";

type LayoutProps = {
	children: React.ReactNode;
};
const Layout = ({ children }: LayoutProps) => {
	const router = useRouter();
	const activeRoute = router.pathname.split("/").pop();

	return (
		<>
			<Head>
				<title>Create T3 App</title>
				<meta name="description" content="Generated by create-t3-app" />
				<meta name="referrer" content="no-referrer" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<Box width="100%" minH="100vh" display="flex">
				<nav>
					<SideBar />
				</nav>
				<Box as="main" flexGrow="1" display="flex" flexDir="column" p={5}>
					{children}
				</Box>
			</Box>
		</>
	);
};

export default Layout;
