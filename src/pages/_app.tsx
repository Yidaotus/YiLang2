import type { AppProps } from "next/app";
import { type Session } from "next-auth";
import type { NextPage } from "next";
import type { ReactElement, ReactNode } from "react";

import { SessionProvider } from "next-auth/react";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { withProse } from "@nikolovlazar/chakra-ui-prose";
import Fonts from "@components/fonts";

import { trpc } from "../utils/trpc";

import "../styles/globals.css";

const theme = extendTheme(
	{
		fonts: {
			heading: `'Outfit', 'Noto Sans JP', sans-serif`,
			body: `'Outfit', 'Noto Sans JP', sans-serif`,
			button: `'Outfit', sans-serif`,
		},
	},
	withProse()
);

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
