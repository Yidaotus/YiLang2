import type { NextPageWithLayout } from "pages/_app";
import type { ReactElement } from "react";

import Layout from "@components/Layout";
import { trpc } from "@utils/trpc";
import { useRouter } from "next/router";
import { useCallback } from "react";

const DocumentsPage: NextPageWithLayout = () => {
	const router = useRouter();
	const allDocuments = trpc.document.getAll.useQuery();

	const loadDocumentFromId = useCallback(
		(id: string) => {
			router.push(`/app/editor/${id}`);
		},
		[router]
	);

	return (
		<div className="min-w-full overflow-x-auto">
			<table className="table w-full">
				<thead>
					<tr>
						<th></th>
						<th>Title</th>
						<th className="w-1/6">Created at</th>
					</tr>
				</thead>
				<tbody>
					{allDocuments.data?.map((entry, index) => (
						<tr key={entry.id}>
							<th>{index}</th>
							<td onClick={() => loadDocumentFromId(entry.id)}>
								{entry.title}
							</td>
							<td>{entry.createdAt.toDateString()}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

DocumentsPage.getLayout = function getLayout(page: ReactElement) {
	return <Layout>{page}</Layout>;
};

export default DocumentsPage;
