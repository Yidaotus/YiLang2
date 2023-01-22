import {
	extendTheme,
	type ThemeConfig,
	Theme,
	ChakraTheme,
	DeepPartial,
} from "@chakra-ui/react";
import { withProse } from "@nikolovlazar/chakra-ui-prose";

const themeConfig: ThemeConfig = {
	initialColorMode: "dark",
	useSystemColorMode: false,
};

const extendedTheme = {
	fonts: {
		heading: `'Inter', 'Noto Sans JP', 'Noto Sans SC', sans-serif`,
		body: `'Inter', 'Noto Sans JP', 'Noto Sans SC', sans-serif`,
		button: `'Inter', sans-serif`,
	},
	fontSizes: {
		sm: "16px",
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
			20: "#F2F4F8",
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
} as const;

const theme = extendTheme(extendedTheme, withProse(), themeConfig);

export default theme;
export { extendedTheme };
