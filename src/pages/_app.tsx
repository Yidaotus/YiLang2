import type { NextPage } from "next";
import { type Session } from "next-auth";
import type { AppProps } from "next/app";
import type { ReactElement, ReactNode } from "react";

import { ChakraProvider } from "@chakra-ui/react";
import Fonts from "@components/fonts";
import { SessionProvider } from "next-auth/react";

import { trpc } from "../utils/trpc";

import "../styles/globals.css";
import theme from "theme";

export type NextPageWithLayout<P = Record<string, unknown>, IP = P> = NextPage<
	P,
	IP
> & {
	getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
	Component: NextPageWithLayout;
	session: Session | null;
};

const MyApp = ({
	Component,
	pageProps: { session, ...pageProps },
}: AppPropsWithLayout) => {
	const getLayout = Component.getLayout ?? ((page) => page);

	return (
		<SessionProvider session={session}>
			<ChakraProvider theme={theme}>
				<Fonts />
				{getLayout(<Component {...pageProps} />)}
			</ChakraProvider>
		</SessionProvider>
	);
};

export default trpc.withTRPC(MyApp);
