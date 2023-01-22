import { ColorModeScript } from "@chakra-ui/react";
import { Head, Html, Main, NextScript } from "next/document";
import theme from "theme";

export default function Document() {
	return (
		<Html>
			<Head />
			<body style={{ margin: 0, padding: 0 }}>
				<ColorModeScript initialColorMode={theme.config.initialColorMode} />
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
