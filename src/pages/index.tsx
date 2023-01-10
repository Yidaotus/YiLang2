import { type NextPage } from "next";
import Head from "next/head";

const Home: NextPage = () => (
	<>
		<Head>
			<title>Home</title>
			<link rel="icon" href="/favicon.ico" />
		</Head>
	</>
);

export async function getServerSideProps() {
	return {
		redirect: {
			permanent: false,
			destination: "/app",
		},
	};
}

export default Home;
