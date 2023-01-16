import type { NextPage } from "next";
import { type Session } from "next-auth";
import type { AppProps } from "next/app";
import type { ReactElement, ReactNode } from "react";

import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import Fonts from "@components/fonts";
import { withProse } from "@nikolovlazar/chakra-ui-prose";
import { SessionProvider } from "next-auth/react";

import { trpc } from "../utils/trpc";

import "../styles/globals.css";

const theme = extendTheme(
	{
		fonts: {
			heading: `'Inter', 'Noto Sans JP', 'Noto Sans SC', sans-serif`,
			body: `'Inter', 'Noto Sans JP', 'Noto Sans SC', sans-serif`,
			button: `'Inter', sans-serif`,
		},
		components: {
			Menu: {
				baseStyle: {
					fontSize: "0.875rem",
				},
			},
			Table: {
				baseStyle: {
					table: {
						fontSize: "0.875rem",
						color: "text.400",
					},
					th: {
						fontWeight: "semibold",
						textTransform: "none",
						bg: "#f7fafc",
						borderTopWidth: "1px",
						borderTopColor: "gray.100",
						borderBottomWidth: "1px",
						borderBottomColor: "gray.100",
					},
				},
			},
		},
		colors: {
			brand: {
				50: "#edf2f7",
				100: "#5374A2",
				200: "#4C6A94",
				300: "#456187",
				400: "#3E5779",
				500: "#344966",
				600: "#31445E",
				700: "#2A3A50",
				800: "#2A3A50",
			},
			text: {
				100: "#E0E5EC",
				200: "#B5C1CF",
				300: "#8F93A3",
				400: "#696F80",
				500: "#40454F",
			},
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
