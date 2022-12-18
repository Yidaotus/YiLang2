import type { NextPageWithLayout } from "pages/_app";
import type { ReactElement } from "react";

import useBearStore from "@store/store";
import { trpc } from "../../utils/trpc";
import Layout from "@components/Layout";

const DictionaryPage: NextPageWithLayout = () => {
	const allWords = trpc.dictionary.getAll.useQuery();
	const bears = useBearStore((state) => state.bears);

	return (
		<div className="min-w-full overflow-x-auto">
			<table className="table w-full">
				<thead>
					<tr>
						<th></th>
						<th>Word</th>
						<th className="w-1/6">Created at</th>
					</tr>
				</thead>
				<tbody>
					{allWords.data?.map((entry, index) => (
						<tr key={entry.id}>
							<th>{index}</th>
							<td>{entry.word}</td>
							<td>{entry.createdAt.toDateString()}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

DictionaryPage.getLayout = function getLayout(page: ReactElement) {
	return <Layout>{page}</Layout>;
};

export default DictionaryPage;
