import type { NextPageWithLayout } from "pages/_app";
import type { ReactElement } from "react";

import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import {
	Box,
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
} from "@chakra-ui/react";
import Layout from "@components/Layout";

const Editor = dynamic(() => import("../../../components/Editor/Editor"), {
	ssr: false,
});

const EditorPage: NextPageWithLayout = () => {
	const router = useRouter();
	const { id } = router.query;

	return (
		<>
			<Box>
				<Breadcrumb>
					<BreadcrumbItem>
						<BreadcrumbLink href="#">Home</BreadcrumbLink>
					</BreadcrumbItem>

					<BreadcrumbItem isCurrentPage>
						<BreadcrumbLink href="#">Breadcrumb</BreadcrumbLink>
					</BreadcrumbItem>
				</Breadcrumb>
			</Box>
			<Editor id={id as string} />
		</>
	);
};

EditorPage.getLayout = function getLayout(page: ReactElement) {
	return <Layout>{page}</Layout>;
};

export default EditorPage;
