import { type NextPage } from "next";
import Head from "next/head";

import dynamic from "next/dynamic";

const Editor = dynamic(() => import("../components/Editor/Editor"), {
	ssr: false,
});

const Home: NextPage = () => {
	return (
		<>
			<Head>
				<title>Create T3 App</title>
				<meta name="description" content="Generated by create-t3-app" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<main className="f-full container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
				<Editor />
			</main>
		</>
	);
};

export default Home;
